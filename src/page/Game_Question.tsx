import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../styles/Game_Question.css'

// 題目資料型別
type QuestionData = {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  isConfirmed?: boolean; // 添加确认状态
};

type QuestionCardProps = {
  questionData: QuestionData;
  onQuestionChange: (data: Omit<QuestionData, "id">) => void;
  questionIndex: number;
  onDelete: () => void;
  onConfirm: () => void;
};

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, onQuestionChange, questionIndex, onDelete, onConfirm }) => {
  const [question, setQuestion] = useState(questionData.question);
  const [options, setOptions] = useState(questionData.options);
  const [correctAnswer, setCorrectAnswer] = useState(questionData.correctAnswer);

  useEffect(() => {
    setQuestion(questionData.question);
    setOptions(questionData.options);
    setCorrectAnswer(questionData.correctAnswer);
  }, [questionData]);

  const handleOptionChange = (option: keyof typeof options, value: string) => {
    const newOptions = {
      ...options,
      [option]: value
    };
    setOptions(newOptions);

    onQuestionChange({
      question,
      options: newOptions,
      correctAnswer,
      isConfirmed: questionData.isConfirmed
    });
  };

  const handleCorrectAnswerChange = (option: keyof typeof options) => {
    const newCorrectAnswer = correctAnswer === option ? '' : option;
    setCorrectAnswer(newCorrectAnswer);

    onQuestionChange({
      question,
      options,
      correctAnswer: newCorrectAnswer,
      isConfirmed: questionData.isConfirmed
    });
  };

  const handleQuestionChange = (newQuestion: string) => {
    setQuestion(newQuestion);

    onQuestionChange({
      question: newQuestion,
      options,
      correctAnswer,
      isConfirmed: questionData.isConfirmed
    });
  };

  // 检查题目是否可以确认（至少有题目内容）
  const canConfirm = question.trim().length > 0;

  return (
    <div className={`question-card ${questionData.isConfirmed ? 'confirmed' : ''}`}>
      {/* 删除按钮 */}
      <button 
        onClick={onDelete}
        className="delete-question-btn"
        title="刪除題目"
      >
        ×
      </button>
      
      {/* 确认状态指示器 */}
      {questionData.isConfirmed && (
        <div className="confirmed-badge">
          ✓ 已確認
        </div>
      )}
      
      {/* 題目輸入區域 */}
      <div className="question-input-area">
        <input
          type="text"
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="question-input"
          placeholder="請輸入題目"
          disabled={questionData.isConfirmed}
        />
      </div>

      {/* 選項區域 */}
      <div className="options-area">
        {Object.entries(options).map(([option, value]) => (
          <div key={option} className="option-row">
            {/* 正確答案勾選框 */}
            <button
              type="button"
              onClick={() => handleCorrectAnswerChange(option as keyof typeof options)}
              className={`correct-answer-btn ${correctAnswer === option ? 'selected' : ''}`}
              disabled={questionData.isConfirmed}
            >
              {correctAnswer === option && <span className="checkmark">✓</span>}
            </button>

            {/* 選項標籤和輸入框 */}
            <div className="option-content">
              <span className="option-label">({option})</span>
              <input
                type="text"
                value={value}
                onChange={(e) => handleOptionChange(option as keyof typeof options, e.target.value)}
                className="option-input"
                placeholder={`選項 ${option}`}
                disabled={questionData.isConfirmed}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 确认按钮 */}
      {!questionData.isConfirmed && (
        <div className="question-actions">
          <button
            onClick={onConfirm}
            className={`confirm-btn ${canConfirm ? 'enabled' : 'disabled'}`}
            disabled={!canConfirm}
            title={canConfirm ? '確認題目' : '請先輸入題目內容'}
          >
            {canConfirm ? '✓ 確認題目' : '請輸入題目'}
          </button>
        </div>
      )}
    </div>
  );
};

export const GameQuestion: React.FC = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const { chapter_name } = useParams();

  const QUESTIONS_PER_PAGE = 20;

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));

  useEffect(() => {
    console.log("當前主題:", chapter_name);
  }, [chapter_name]);

  // 生成localStorage的key
  const getStorageKey = () => `questions_${chapter_name || 'default'}`;

  // 检查题目是否为空（没有确认的题目算空题目）
  const isQuestionEmpty = (question: QuestionData) => {
    return !question.isConfirmed;
  };

  // 过滤空题目并重新分配ID
  const filterAndReindexQuestions = (questionsToFilter: QuestionData[]) => {
    const filteredQuestions = questionsToFilter.filter(q => !isQuestionEmpty(q));
    return filteredQuestions.map((q, index) => ({
      ...q,
      id: index + 1
    }));
  };

  // 从localStorage加载题目数据
  const loadQuestionsFromStorage = () => {
    try {
      const storageKey = getStorageKey();
      const savedQuestions = localStorage.getItem(storageKey);
      if (savedQuestions) {
        const parsed = JSON.parse(savedQuestions);
        if (Array.isArray(parsed)) {
          // 加载时也过滤空题目，确保数据干净
          return filterAndReindexQuestions(parsed);
        }
      }
    } catch (error) {
      console.error('加载题目数据时出错:', error);
    }
    return [];
  };

  // 保存题目数据到localStorage（不过滤空题目）
  const saveQuestionsToStorage = (questionsToSave: QuestionData[]) => {
    try {
      const storageKey = getStorageKey();
      // 直接保存，不在这里过滤空题目
      localStorage.setItem(storageKey, JSON.stringify(questionsToSave));
    } catch (error) {
      console.error('保存题目数据时出错:', error);
    }
  };

  // 初始化题目数据（页面加载时立即清理空题目）
  useEffect(() => {
    const savedQuestions = loadQuestionsFromStorage();
    // 页面加载时立即清理未确认的空题目
    const cleanedQuestions = filterAndReindexQuestions(savedQuestions);
    setQuestions(cleanedQuestions);
  }, [chapter_name]);

  // 当题目数据变化时自动保存
  useEffect(() => {
    if (questions.length > 0) {
      saveQuestionsToStorage(questions);
    }
  }, [questions, chapter_name]);

  // 新增題目
  const addNewQuestion = () => {
    const newQuestion: QuestionData = {
      id: questions.length + 1,
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: '',
      isConfirmed: false
    };
    
    const newQuestions = [...questions, newQuestion];
    setQuestions(newQuestions);
    
    // 計算新題目應該在哪一頁
    const newQuestionPage = Math.ceil(newQuestions.length / QUESTIONS_PER_PAGE);
    
    // 如果新題目在新的頁面，自動跳轉到該頁面
    if (newQuestionPage > currentPage) {
      setCurrentPage(newQuestionPage);
    }
  };

  // 确认题目
  const confirmQuestion = (questionId: number) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, isConfirmed: true } : q
      )
    );
  };

  // 删除题目
  const deleteQuestion = (questionId: number) => {
    const newQuestions = questions.filter(q => q.id !== questionId);
    // 重新分配ID以保持连续性
    const reindexedQuestions = newQuestions.map((q, index) => ({
      ...q,
      id: index + 1
    }));
    
    setQuestions(reindexedQuestions);
    
    // 檢查當前頁面是否還有效
    const newTotalPages = Math.max(1, Math.ceil(reindexedQuestions.length / QUESTIONS_PER_PAGE));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  // 获取当前页面的题目
  const getCurrentPageQuestions = () => {
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    return questions.slice(startIndex, endIndex);
  };

  // 更新題目資料
  const handleQuestionChange = (questionId: number, questionData: Omit<QuestionData, "id">) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, ...questionData } : q
      )
    );
  };

  // 根據搜尋過濾當前頁面的題目
  const filteredQuestions = getCurrentPageQuestions().filter(q =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );

  // 分页按钮点击处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearch(''); // 切换页面时清空搜索
  };

  return (
    <div className="container">
      <div className="home-header">
        <span>Hi, Username</span>
      </div>
      <h2>主題: {chapter_name}</h2>
      
      {/* 分页按钮 */}
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

      {/* 页面信息和新增题目按钮 */}
      <div className="page-controls">
        <div className="page-info">
          第 {currentPage} 頁 / 共 {totalPages} 頁 
          (題目 {(currentPage - 1) * QUESTIONS_PER_PAGE + 1} - {Math.min(currentPage * QUESTIONS_PER_PAGE, questions.length)})
        </div>
        
        <div className="add-question-section">
          <button onClick={addNewQuestion} className="add-question-btn">
            + 新增題目
          </button>
        </div>
      </div>

      {/* 題目网格 */}
      <div className="questions-grid">
        {filteredQuestions.map((questionData, index) => (
          <div key={questionData.id} className="question-grid-item">
            <div className="question-header">
              <span className="question-number">第 {questionData.id} 題</span>
            </div>
            <QuestionCard
              questionData={questionData}
              onQuestionChange={(data) => handleQuestionChange(questionData.id, data)}
              questionIndex={(currentPage - 1) * QUESTIONS_PER_PAGE + index}
              onDelete={() => deleteQuestion(questionData.id)}
              onConfirm={() => confirmQuestion(questionData.id)}
            />
          </div>
        ))}
      </div>

      {/* 如果沒有題目 */}
      {questions.length === 0 && (
        <div className="no-questions">
          尚無任何題目，請點擊「新增題目」開始建立
        </div>
      )}

      {/* 如果搜尋無結果 */}
      {filteredQuestions.length === 0 && search && questions.length > 0 && (
        <div className="no-questions">
          沒有找到符合搜尋條件的題目
        </div>
      )}
    </div>
  );
};