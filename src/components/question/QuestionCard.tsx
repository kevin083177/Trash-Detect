import React, { useState, useEffect } from 'react';
import './styles/QuestionCard.css';
import type { TempQuestion } from "../../interfaces/question";

interface QuestionCardProps {
  questionData: TempQuestion;
  onQuestionUpdate: (question: TempQuestion) => void;
  onQuestionDelete: (questionId: string) => void;
  onConfirmNew?: (question: TempQuestion) => void;
  onCancelNew?: () => void;
  isEditing: boolean;
  onStartEdit: (questionId: string) => boolean;
  onEndEdit: () => void;
  canEdit: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionData,
  onQuestionUpdate,
  onQuestionDelete,
  onConfirmNew,
  onCancelNew,
  isEditing,
  onStartEdit,
  onEndEdit,
  canEdit
}) => {
  const [localData, setLocalData] = useState<TempQuestion>(questionData);
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    setLocalData(questionData);
  }, [questionData]);

  useEffect(() => {
    if (!isEditing) {
      setLocalData(questionData);
      setValidationMessage('');
    }
  }, [isEditing, questionData]);

  const questionId = localData.tempId || localData._id;

  const handleEdit = () => {
    if (!canEdit) return;
    
    const canStartEdit = onStartEdit(questionId);
    if (!canStartEdit) {
      return;
    }
  };

  const handleCancel = () => {
    if (onCancelNew) {
      onCancelNew();
    } else {
      setLocalData(questionData);
      setValidationMessage('');
      onEndEdit();
    }
  };

  const handleDelete = () => {
    if (!canEdit) return;
    
    if (window.confirm('確定要刪除此題目嗎？')) {
      onQuestionDelete(questionId);
    }
  };

  const isQuestionValid = (): boolean => {
    return !!(
      localData.content.trim() &&
      localData.options.every(option => option.text.trim()) &&
      localData.correct_answer
    );
  };

  const handleConfirm = () => {
    if (onConfirmNew) {
      onConfirmNew(localData);
    } else {
      onQuestionUpdate(localData);
    }
  };

  const handleContentChange = (content: string) => {
    setLocalData(prev => ({ ...prev, content }));
  };

  const handleOptionChange = (optionId: string, text: string) => {
    setLocalData(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === optionId ? { ...option, text } : option
      )
    }));
  };

  const handleCorrectAnswerChange = (answerId: string) => {
    setLocalData(prev => ({ ...prev, correct_answer: answerId }));
  };

  const isNewQuestion = !!onConfirmNew;

  return (
    <div className="question-card">
      {validationMessage && (
        <div className="validation-message">
          {validationMessage}
        </div>
      )}

      <div className="question-input-area">
        {isEditing ? (
          <textarea
            className="question-input"
            placeholder="請輸入題目內容"
            value={localData.content}
            onChange={(e) => handleContentChange(e.target.value)}
          />
        ) : (
          <div className="question-input" style={{ 
            border: 'none', 
            backgroundColor: 'transparent',
            cursor: 'default'
          }}>
            {localData.content || '題目內容'}
          </div>
        )}
      </div>

      <div className="options-area">
        {localData.options.map((option) => (
          <div key={option.id} className="option-row">
            {isEditing ? (
              <button
                className={`correct-answer-btn ${localData.correct_answer === option.id ? 'selected' : ''}`}
                onClick={() => handleCorrectAnswerChange(option.id)}
                type="button"
              >
                {localData.correct_answer === option.id && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ) : (
              <div className={`correct-answer-display ${localData.correct_answer === option.id ? 'selected' : ''}`}>
                {localData.correct_answer === option.id && (
                  <span className="checkmark">✓</span>
                )}
              </div>
            )}

            <div className="option-content">
              <span className="option-label">{option.id}.</span>
              
              {isEditing ? (
                <textarea
                  className="option-input"
                  placeholder={`請輸入選項 ${option.id}`}
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                />
              ) : (
                <div className="option-display">
                  {option.text || `選項 ${option.id}`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="question-actions">
        {isEditing ? (
          <>
            <button
              className={`action-btn confirm-btn ${isQuestionValid() ? 'enabled' : 'disabled'}`}
              onClick={handleConfirm}
              type="button"
              disabled={!isQuestionValid()}
            >
              {isNewQuestion ? '新增' : '確認'}
            </button>
            
            <button
              className="action-btn cancel-btn"
              onClick={handleCancel}
              type="button"
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              className="action-btn edit-btn"
              onClick={handleEdit}
              disabled={!canEdit}
              type="button"
              title={!canEdit ? '目前有其他題目正在編輯中' : '編輯題目'}
            >
              編輯
            </button>
            
            <button
              className="action-btn delete-btn"
              onClick={handleDelete}
              disabled={!canEdit}
              type="button"
              title={!canEdit ? '目前有其他題目正在編輯中' : '刪除題目'}
            >
              刪除
            </button>
          </>
        )}
      </div>
    </div>
  );
};