import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TutorialStep } from '@/interface/Tutorial';
import { useTutorial } from '@/hooks/tutorial';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface TutorialProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
}

export function Tutorial({ visible, steps, onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const insets = useSafeAreaInsets();
  const { initialStep, saveUsername } = useTutorial();

  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [spotlightStyle, setSpotlightStyle] = useState({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    borderRadius: 12,
  });

  useEffect(() => {
    if (visible) {
      setCurrentStep(initialStep);
      setIsVisible(true);
      startTutorial();
    } else {
      hideTutorial();
    }
  }, [visible, initialStep]);

  useEffect(() => {
    if (isVisible && steps.length > 0) {
      animateToStep(currentStep);
    }
  }, [currentStep, isVisible]);

  const startTutorial = () => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      animateToStep(0);
    }, 100);
  };

  const calculatePadding = (step: TutorialStep) => {
    const stepPadding = step.spotlight?.padding;
    const defaultPadding = 10;

    if (typeof stepPadding === 'number') {
      return {
        top: stepPadding,
        right: stepPadding,
        bottom: stepPadding,
        left: stepPadding,
      };
    } else if (stepPadding && typeof stepPadding === 'object') {
      return {
        top: stepPadding.top ?? defaultPadding,
        right: stepPadding.right ?? defaultPadding,
        bottom: stepPadding.bottom ?? defaultPadding,
        left: stepPadding.left ?? defaultPadding,
      };
    } else {
      return {
        top: defaultPadding,
        right: defaultPadding,
        bottom: defaultPadding,
        left: defaultPadding,
      };
    }
  };

  const animateToStep = (stepIndex: number) => {
    if (stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    const { targetElement } = step;
      
    if (targetElement) {
      const padding = calculatePadding(step);
      const borderRadius = 12;
      
      const spotX = targetElement.x - padding.left;
      const spotY = targetElement.y - padding.top;
      const spotW = targetElement.width + padding.left + padding.right;
      const spotH = targetElement.height + padding.top + padding.bottom;

      setSpotlightStyle({
        left: spotX,
        top: spotY,
        width: spotW,
        height: spotH,
        borderRadius: borderRadius,
      });
    }
  };

  const hideTutorial = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      setCurrentStep(0);
      setInputValue('');
    });
  };

  const handleNext = async () => {
    const step = steps[currentStep];
    if (step.requiresInput && step.id === 'dog') {
      if (!inputValue.trim()) {
        setErrorMessage('請輸入您的名稱');
        return;
      }

      if (inputValue.trim().length < 6 || inputValue.trim().length > 12) {
        setErrorMessage('名稱長度需介於 6 至 12 字元');
        return;
      }
      
      setIsProcessing(true);
      try {
        await saveUsername(inputValue.trim());
        setTimeout(() => {
          setIsProcessing(false);
          proceedToNextStep();
        }, 500);
      } catch (error) {
        setIsProcessing(false);
        setErrorMessage('網路錯誤，請重新嘗試');
        return;
      }
    } else {
      proceedToNextStep();
    }
  };

  const proceedToNextStep = () => {
    const step = steps[currentStep];
    
    if (step.action) {
      step.action();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      hideTutorial();
      setTimeout(() => {
        onComplete();
      }, 200);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      '跳過教學',
      '確定要跳過新手教學嗎？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '確定',
          style: 'destructive',
          onPress: () => {
            hideTutorial();
            setTimeout(() => {
              onComplete();
            }, 200);
          },
        },
      ]
    );
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getContentPosition = () => {
    const step = steps[currentStep];
    if (!step) return { 
      position: 'center',
      top: height / 2 - 125,
      left: (width - 350) / 2,
    };

    const { targetElement, placement, requiresInput } = step;
    const contentHeight = 250;
    const contentWidth = 350;
    const margin = 20;
    const arrowSize = 8;
    
    const inputAdjustment = requiresInput ? 40 : 0;

    if (!targetElement) {
      return {
        position: 'center',
        top: height / 2 - contentHeight / 2 - inputAdjustment,
        left: (width - contentWidth) / 2,
      };
    }

    if (placement === 'screen-top') {
      return {
        position: 'screen-position',
        top: insets.top + margin - inputAdjustment,
        left: (width - contentWidth) / 2,
      }
    }

    if (placement === 'screen-center') {
      return {
        position: 'center',
        top: height / 2 - contentHeight / 2 - inputAdjustment,
        left: (width - contentWidth) / 2,
      };
    }

    const targetCenterX = targetElement.x + targetElement.width / 2;

    switch (placement) {
      case 'top':
        return {
          position: 'relative',
          top: Math.max(
            insets.top + margin,
            targetElement.y - contentHeight - arrowSize - margin - inputAdjustment
          ),
          left: Math.max(margin, Math.min(
            targetCenterX - contentWidth / 2,
            width - contentWidth - margin
          )),
        };
      case 'bottom':
        return {
          position: 'relative',
          top: Math.min(
            height - contentHeight - insets.bottom - margin,
            targetElement.y + targetElement.height + arrowSize + margin - inputAdjustment
          ),
          left: Math.max(margin, Math.min(
            targetCenterX - contentWidth / 2,
            width - contentWidth - margin
          )),
        };
      default:
        return {
          position: 'center',
          top: height / 2 - contentHeight / 2,
          left: (width - contentWidth) / 2,
        };
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const contentPosition = getContentPosition();
  const hasTarget = !!currentStepData?.targetElement;
  const isFirstStep = currentStep === 0 && currentStepData?.requiresInput;

  return (
    <View style={styles.container}>
      {!hasTarget && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
          ]}
        />
      )}

      {hasTarget && (
        <Animated.View
          style={[
            styles.spotlightContainer,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <Mask id={`spotlight-mask-${currentStep}`}>
                <Rect width="100%" height="100%" fill="white" />
                <Rect
                  x={spotlightStyle.left}
                  y={spotlightStyle.top}
                  width={spotlightStyle.width}
                  height={spotlightStyle.height}
                  rx={spotlightStyle.borderRadius}
                  ry={spotlightStyle.borderRadius}
                  fill="black"
                />
              </Mask>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.6)"
              mask={`url(#spotlight-mask-${currentStep})`}
            />
          </Svg>

          <View
            style={[
              styles.spotlightBorder,
              {
                left: spotlightStyle.left,
                top: spotlightStyle.top,
                width: spotlightStyle.width,
                height: spotlightStyle.height,
                borderRadius: spotlightStyle.borderRadius,
                borderWidth: 2,
                borderColor: 'white',
              },
            ]}
          />
        </Animated.View>
      )}

      <View
        style={[
          contentPosition.position === 'center' ? styles.contentCentered : styles.content,
          {
            top: contentPosition.top,
            left: contentPosition.left,
          },
        ]}
      >
        <View style={styles.contentCard}>
          <View style={styles.header}>
            <Text style={styles.stepIndicator}>
              {currentStep + 1} / {steps.length}
            </Text>
            {!isFirstStep && (
              <TouchableWithoutFeedback onPress={handleSkip}>
                <View style={styles.skipButton}>
                  <Text style={styles.skipText}>跳過</Text>
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>

          <Text style={styles.title}>{currentStepData?.title}</Text>
          <Text style={styles.description}>{currentStepData?.description}</Text>

          {isFirstStep && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="請輸入您的名字"
                placeholderTextColor="#999"
                value={inputValue}
                onChangeText={setInputValue}
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleNext}
              />
            </View>
          )}

          {errorMessage && (
            <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>{errorMessage}</Text>
          )}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity onPress={handlePrevious} style={styles.previousButton}>
                <Ionicons name="arrow-back" size={18} color="#666" />
                <Text style={styles.previousText}>上一步</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={handleNext} 
              style={[
                styles.nextButton,
                isProcessing && styles.nextButtonDisabled
              ]}
              disabled={isProcessing}
            >
              <Text style={styles.nextText}>
                {isFirstStep ? '確認' : (currentStep === steps.length - 1 ? '完成' : '下一步')}
              </Text>
              {!isFirstStep && currentStep < steps.length - 1 && (
                <Ionicons name="arrow-forward" size={18} color="white" />
              )}
              {isProcessing && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>保存中...</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {hasTarget && 
        currentStepData?.placement !== 'screen-center' && 
        currentStepData?.placement !== 'screen-top' && (
          <View style={[styles.arrow, getArrowStyle(currentStepData?.placement, spotlightStyle, contentPosition)]} />
        )}
      </View>
    </View>
  );

  function getArrowStyle(
    placement?: 'top' | 'bottom',
    spotlight?: { left: number; top: number; width: number; height: number },
    contentPosition?: any
  ) {
    if (!placement || !spotlight || !contentPosition) return {};
    
    const targetElement = currentStepData?.targetElement;
    
    if (!targetElement) return {};
    const targetCenterX = targetElement.x + targetElement.width / 2;
    
    const contentLeft = typeof contentPosition.left === 'number' ? contentPosition.left : 0;

    switch (placement) {
      case 'top':
        return {
          bottom: -6,
          left: Math.max(8, Math.min(
            targetCenterX - contentLeft - 8,
            350 - 16  // contentWidth - arrowWidth
          )),
          borderTopColor: 'white',
          borderTopWidth: 8,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
        };
      
      case 'bottom':
        return {
          top: -6,
          left: Math.max(8, Math.min(
            targetCenterX - contentLeft - 8,
            350 - 16
          )),
          borderBottomColor: 'white',
          borderBottomWidth: 8,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
        };
      
      default:
        return {};
    }
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightBorder: {
    position: 'absolute',
    backgroundColor: 'transparent'
  },
  content: {
    position: 'absolute',
    width: 350,
  },
  contentCentered: {
    position: 'absolute',
    width: 350,
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previousText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginRight: 6,
  },
  loadingContainer: {
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 13,
    color: 'white',
    opacity: 0.8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
    transform: [{ scale: 1.3 }],
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
});