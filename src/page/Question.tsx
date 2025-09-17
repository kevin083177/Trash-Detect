import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import '../styles/Question.css';
import type { TempQuestion } from "../interfaces/question";
import { asyncGet, asyncPost, asyncDelete, asyncPut } from "../utils/fetch";
import { chapter_api, question_api } from "../api/api";
import { QuestionCard } from "../components/question/QuestionCard";
import { IoGameController } from "react-icons/io5";
import { useNotification } from "../context/NotificationContext";

export const Question: React.FC = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<TempQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const { chapter_name } = useParams();

  const QUESTIONS_PER_PAGE = 20;

  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));

  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  
  const loadQuestions = async () => {
    setLoading(true);
    
    try {
      const response: any = await asyncGet(`${question_api.get_question_by_category}/${chapter_name?.slice(0, -2)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.body && Array.isArray(response.body)) {
        setQuestions(response.body);
      }
    } catch (err) {
      console.error('載入題目數據時出錯:', err);
      showError('載入題目數據失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chapter_name) {
      loadQuestions();
    }
  }, [chapter_name]);

  const checkCanPerformAction = (targetQuestionId: string): boolean => {
    if (!editingQuestionId || editingQuestionId === targetQuestionId) {
      return true;
    }

    const confirmCancel = window.confirm(
      '目前有其他題目正在編輯中，是否要取消當前編輯並繼續？'
    );
    
    if (confirmCancel) {
      setEditingQuestionId(null);
      return false;
    }
    
    return false;
  };

  const handleDelete = async() => {
    if (window.confirm('確認要刪除該遊戲主題嗎？所有題目與關卡將全部消失！')) {
      setDeletingChapter(true);
      try {
        const response = await asyncDelete(chapter_api.delete_chapter, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: {
            name: chapter_name
          }
        })
        console.log(response);
        
        if (response.status === 200) {
          showSuccess('成功刪除遊戲主題');
          navigate('/game')
        } else {
          showError('刪除遊戲主題失敗');
        }
      } catch (error) {
        showError('刪除遊戲主題失敗')
        console.log(error);
      } finally {
        setDeletingChapter(false);
      }
    }
  }

  const handleStartEdit = (questionId: string): boolean => {
    if (!checkCanPerformAction(questionId)) {
      return false;
    }
    setEditingQuestionId(questionId);
    return true;
  };

  const handleEndEdit = () => {
    setEditingQuestionId(null);
  };

  const addNewQuestion = async () => {
    if (editingQuestionId) {
      const confirmCancel = window.confirm(
        '目前有題目正在編輯中，是否要取消當前編輯並新增題目？'
      );
      
      if (!confirmCancel) {
        return;
      }
      setEditingQuestionId(null);
    }

    const tempId = `temp_${Date.now()}`;
    const newTempQuestion: TempQuestion = {
      _id: tempId,
      category: chapter_name?.slice(0, -2) || '',
      content: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
      ],
      correct_answer: '',
      isTemporary: true,
      tempId: tempId
    };
    
    const newQuestions = [...questions, newTempQuestion];
    setQuestions(newQuestions);
    
    const newQuestionPage = Math.ceil(newQuestions.length / QUESTIONS_PER_PAGE);
    setCurrentPage(newQuestionPage);
    setSearch('');
    
    setEditingQuestionId(tempId);
  };

  const confirmNewQuestion = async (questionData: TempQuestion) => {
    try {
      setLoading(true);
      
      const { isTemporary, tempId, _id, ...questionToSend } = questionData;
      
      const response = await asyncPost(question_api.add_question, {
        body: questionToSend,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 200) {
        await loadQuestions();
        const newTotalPages = Math.max(1, Math.ceil((questions.length) / QUESTIONS_PER_PAGE));
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
        handleEndEdit();
        showSuccess('題目新增成功');
      } else {
        showError('新增題目失敗');
      }
    } catch (err) {
      console.error('新增題目時出錯:', err);
      showError('新增題目失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const cancelNewQuestion = (tempId: string) => {
    setQuestions(prev => prev.filter(q => q.tempId !== tempId));
    setCurrentPage(1);
    handleEndEdit();
  };

  const updateQuestion = async (updatedQuestion: TempQuestion) => {
    if (updatedQuestion.isTemporary) {
      setQuestions(prev =>
        prev.map(q =>
          q.tempId === updatedQuestion.tempId ? updatedQuestion : q
        )
      );
      return;
    }

    try {
      setLoading(true);
      const response = await asyncPut(question_api.update_question, {
        body: updatedQuestion,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.status === 200) {
        setQuestions(prev =>
          prev.map(q =>
            q._id === updatedQuestion._id ? updatedQuestion : q
          )
        );
        handleEndEdit();
        showSuccess('題目更新成功');
      } else {
        showError('更新題目失敗');
      }
    } catch (err) {
      console.error('更新題目時出錯:', err);
      showError('更新題目失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!checkCanPerformAction(questionId)) {
      return;
    }

    try {
      setLoading(true);
      const response = await asyncDelete(question_api.delete_question, {
        body: { _id: questionId },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 200) {
        const newQuestions = questions.filter(q => q._id !== questionId);
        setQuestions(newQuestions);
        
        const newTotalPages = Math.max(1, Math.ceil(newQuestions.length / QUESTIONS_PER_PAGE));
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
        
        if (editingQuestionId === questionId) {
          handleEndEdit();
        }
        showSuccess('題目刪除成功');
      } else {
        showError('刪除題目失敗');
      }
    } catch (err) {
      showError('刪除題目失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPageQuestions = () => {
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    return questions.slice(startIndex, endIndex);
  };

  const filteredQuestions = getCurrentPageQuestions().filter(q =>
    q.content.toLowerCase().includes(search.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    if (editingQuestionId) {
      const confirmCancel = window.confirm(
        '目前有題目正在編輯中，是否要取消當前編輯並切換頁面？'
      );
      
      if (!confirmCancel) {
        return;
      }
      setEditingQuestionId(null);
    }
    
    setCurrentPage(page);
    setSearch('');
  };

  if (loading) {
    return (
      <div className="question-container">
        <div className="question-loading">載入題目中</div>
      </div>
    );
  }

  return (
    <div className="question-container">
      <div className="question-header">
        <div className="question-search-group">
          <span role="img" aria-label="search" style={{ fontSize: 20 }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="搜尋題目"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="question-search-input"
          />
        </div>

        <div className="question-pagination-buttons">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`question-page-btn ${currentPage === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button onClick={addNewQuestion} className="question-add-btn" disabled={loading}>
          <IoGameController size={20}/>
          <p>新增題目</p>
        </button>
      </div>

      <div className="question-info-section">
        <div className="question-total-count">
          {`共 ${Math.min(currentPage * QUESTIONS_PER_PAGE, questions.length)} / ${questions.length} 題`}
        </div>
      </div>

      <div className="question-grid">
        {filteredQuestions.map((questionData) => (
          <div key={questionData.tempId || questionData._id} className="question-grid-item">
            <QuestionCard
              questionData={questionData}
              onQuestionUpdate={updateQuestion}
              onQuestionDelete={deleteQuestion}
              onConfirmNew={questionData.isTemporary ? confirmNewQuestion : undefined}
              onCancelNew={questionData.isTemporary ? () => cancelNewQuestion(questionData.tempId!) : undefined}
              isEditing={editingQuestionId === (questionData.tempId || questionData._id)}
              onStartEdit={handleStartEdit}
              onEndEdit={handleEndEdit}
              canEdit={!editingQuestionId || editingQuestionId === (questionData.tempId || questionData._id)}
            />
          </div>
        ))}
      </div>
      
      {questions.length === 0 && !loading && (
        <div className="question-no-questions">
          尚無任何題目，請點擊「新增題目」按鈕開始建立
        </div>
      )}

      {filteredQuestions.length === 0 && search && questions.length > 0 && (
        <div className="question-no-questions">
          沒有找到相符的題目
        </div>
      )}

      {!search && (
        <div className="question-remove-chapter-container">
          <button 
            className="question-remove-chapter-btn" 
            onClick={handleDelete}
            disabled={deletingChapter}
          >
            {deletingChapter ? '刪除中...' : '刪除遊戲主題'}
          </button>
        </div>
      )}
    </div>
  );
};