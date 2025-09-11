import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import '../styles/Game_Question.css';
import type { Question, TempQuestion } from "../interfaces/question";
import { asyncGet, asyncPost, asyncDelete, asyncPut } from "../utils/fetch";
import { question_api } from "../api/api";
import { QuestionCard } from "../components/question/QuestionCard";
import { Header } from "../components/Header";

export const GameQuestion: React.FC = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<TempQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chapter_name } = useParams();

  const QUESTIONS_PER_PAGE = 20;

  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await asyncGet(`${question_api.get_question_by_category}/${chapter_name?.slice(0, -2)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.body && Array.isArray(response.body)) {
        setQuestions(response.body);
      }
    } catch (err) {
      console.error('加載題目數據時出錯:', err);
      setError('加載題目數據失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chapter_name) {
      loadQuestions();
    }
  }, [chapter_name]);

  const addNewQuestion = async () => {
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
    setSearch(''); // 清空搜尋
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
      } else {
        setError('新增題目失敗');
      }
    } catch (err) {
      console.error('新增題目時出錯:', err);
      setError('新增題目失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const cancelNewQuestion = (tempId: string) => {
    setQuestions(prev => prev.filter(q => q.tempId !== tempId));
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
      } else {
        setError('更新題目失敗');
      }
    } catch (err) {
      console.error('更新題目時出錯:', err);
      setError('更新題目失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
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
      } else {
        setError('刪除題目失敗');
      }
    } catch (err) {
      setError('刪除題目失敗，請稍後重試');
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
    setCurrentPage(page);
    setSearch('');
  };

  const handleReload = () => {
    loadQuestions();
  };

  if (loading) {
    return (
      <div className="question-container">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="question-container">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={handleReload} className="reload-btn">
              重新載入
            </button>
          </div>
        )}
        
        <div className="question-header">
          <div className="search-group">
            <span role="img" aria-label="search" style={{ fontSize: 20 }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="搜尋題目"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="page-controls">
            <div className="add-question-section">
              <button onClick={addNewQuestion} className="add-question-btn" disabled={loading}>
                + 新增題目
              </button>
              <button onClick={handleReload} className="reload-btn" disabled={loading}>
                ↻
              </button>
            </div>
          </div>
        </div>

        <div className="pagination-section">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <div className="questions-grid">
          {filteredQuestions.map((questionData, index) => (
            <div key={questionData.tempId || questionData._id} className="question-grid-item">
              <QuestionCard
                questionData={questionData}
                onQuestionUpdate={updateQuestion}
                onQuestionDelete={deleteQuestion}
                onConfirmNew={questionData.isTemporary ? confirmNewQuestion : undefined}
                onCancelNew={questionData.isTemporary ? () => cancelNewQuestion(questionData.tempId!) : undefined}
              />
            </div>
          ))}
        </div>
        {questions.length === 0 && !loading && (
          <div className="no-questions">
            尚無任何題目，請點擊「新增題目」開始建立或「重新載入」獲取數據
          </div>
        )}

        {filteredQuestions.length === 0 && search && questions.length > 0 && (
          <div className="no-questions">
            沒有找到符合搜尋條件的題目
          </div>
        )}
      </div>
    </>
  );
};