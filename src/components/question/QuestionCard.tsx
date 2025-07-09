import React, { useState, useEffect } from "react";
import type { Question, TempQuestion } from "../../interfaces/question";
import './styles/QuestionCard.css';

type QuestionCardProps = {
  questionData: TempQuestion;
  onQuestionUpdate: (questionData: TempQuestion) => void;
  onQuestionDelete: (questionId: string) => void;
  onConfirmNew?: (questionData: TempQuestion) => void;
  onCancelNew?: () => void;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  questionData, 
  onQuestionUpdate, 
  onQuestionDelete,
  onConfirmNew,
  onCancelNew
}) => {
  const [content, setContent] = useState(questionData.content);
  const [options, setOptions] = useState(questionData.options);
  const [correctAnswer, setCorrectAnswer] = useState(questionData.correct_answer);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 如果是臨時題目，預設進入編輯模式
  useEffect(() => {
    setContent(questionData.content);
    setOptions(questionData.options);
    setCorrectAnswer(questionData.correct_answer);
    setHasChanges(false);
    setIsEditing(questionData.isTemporary || false);
  }, [questionData]);

  const handleOptionChange = (optionId: string, value: string) => {
    const newOptions = options.map(option => 
      option.id === optionId ? { ...option, text: value } : option
    );
    setOptions(newOptions);
    setHasChanges(true);
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    const newCorrectAnswer = correctAnswer === optionId ? '' : optionId;
    setCorrectAnswer(newCorrectAnswer);
    setHasChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  // 檢查是否可以保存/確認
  const canSaveOrConfirm = () => {
    if (!content.trim()) return false;
    if (!correctAnswer) return false;
    
    // 檢查所有選項是否都有內容
    const allOptionsHaveContent = options.every(option => option.text.trim().length > 0);
    if (!allOptionsHaveContent) return false;
    
    return hasChanges || questionData.isTemporary;
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // 保存修改
      if (canSaveOrConfirm()) {
        const updatedQuestion: TempQuestion = {
          ...questionData,
          content,
          options,
          correct_answer: correctAnswer,
        };
        onQuestionUpdate(updatedQuestion);
        setHasChanges(false);
      }
      setIsEditing(false);
    } else {
      // 進入編輯模式
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (questionData.isTemporary) {
      // 如果是臨時題目，取消就是刪除
      onCancelNew?.();
    } else {
      // 取消編輯，恢復原始數據
      setContent(questionData.content);
      setOptions(questionData.options);
      setCorrectAnswer(questionData.correct_answer);
      setHasChanges(false);
      setIsEditing(false);
    }
  };

  const handleConfirmNew = () => {
    if (canSaveOrConfirm() && onConfirmNew) {
      const newQuestion: TempQuestion = {
        ...questionData,
        content,
        options,
        correct_answer: correctAnswer,
      };
      onConfirmNew(newQuestion);
    }
  };

  const handleDelete = () => {
    if (window.confirm('確定要刪除這個題目嗎？')) {
      onQuestionDelete(questionData._id);
    }
  };

  // 驗證錯誤信息
  const getValidationMessage = () => {
    if (!content.trim()) return "請輸入題目內容";
    if (!correctAnswer) return "請選擇正確答案";
    
    const emptyOptions = options.filter(option => !option.text.trim());
    if (emptyOptions.length > 0) {
      return `請完整填寫選項 ${emptyOptions.map(opt => opt.id).join(', ')}`;
    }
    
    return "";
  };

  return (
    <div className="question-card">
      {/* 題目編號和操作按鈕 */}
      <div className="question-header">
        <div className="question-actions">
          {questionData.isTemporary ? (
            // 新增模式：顯示確認和取消按鈕
            <>
              <button 
                onClick={handleConfirmNew}
                className={`confirm-new-btn ${canSaveOrConfirm() ? 'can-confirm' : ''}`}
                title={canSaveOrConfirm() ? "確認新增" : getValidationMessage()}
                disabled={!canSaveOrConfirm()}
              >
                ✓
              </button>
              
              <button 
                onClick={handleCancelEdit}
                className="cancel-new-btn"
                title="取消新增"
              >
                ✕
              </button>
            </>
          ) : (
            // 一般模式：顯示編輯/保存和刪除按鈕
            <>
              {/* 編輯/保存按鈕 */}
              <button 
                onClick={handleEditToggle}
                className={`edit-toggle-btn ${isEditing && canSaveOrConfirm() ? 'can-save' : ''}`}
                title={isEditing ? (canSaveOrConfirm() ? "保存修改" : "無修改可保存") : "編輯題目"}
                disabled={isEditing && !canSaveOrConfirm()}
              >
                {isEditing ? '✓' : '✏️'}
              </button>
              
              {/* 取消編輯按鈕 (僅在編輯模式下顯示) */}
              {isEditing && (
                <button 
                  onClick={handleCancelEdit}
                  className="cancel-edit-btn"
                  title="取消編輯"
                >
                  ✕
                </button>
              )}
              
              {/* 刪除按鈕 */}
              <button 
                onClick={handleDelete}
                className="delete-question-btn"
                title="刪除題目"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {/* 驗證錯誤提示 */}
      {questionData.isTemporary && !canSaveOrConfirm() && (
        <div className="validation-message">
          {getValidationMessage()}
        </div>
      )}
           
      {/* 題目輸入區域 */}
      <div className="question-input-area">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="question-input"
          placeholder="請輸入題目"
          disabled={!isEditing}
          rows={3}
        />
      </div>

      {/* 選項區域 */}
      <div className="options-area">
        {options.map((option) => (
          <div key={option.id} className="option-row">
            {/* 正確答案勾選框 */}
            <button
              type="button"
              onClick={() => handleCorrectAnswerChange(option.id)}
              className={`correct-answer-btn ${correctAnswer === option.id ? 'selected' : ''}`}
              disabled={!isEditing}
            >
              {correctAnswer === option.id && <span className="checkmark">✓</span>}
            </button>

            {/* 選項標籤和輸入框 */}
            <div className="option-content">
              <span className="option-label">({option.id})</span>
              <textarea
                value={option.text}
                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                className="option-input"
                placeholder={`選項 ${option.id}`}
                disabled={!isEditing}
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};