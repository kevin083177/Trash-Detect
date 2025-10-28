import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface DogProps {
  source: any;
  size: number;
  initialX?: number;
  initialY: number;
  autoWalk: boolean; 
  paused?: boolean;
}

type DogState = 'idle' | 'walking' | 'paused';

export const Dog = forwardRef<View, DogProps>(({
  source,
  size,
  initialX = width / 2,
  initialY,
  autoWalk,
  paused = false,
}, ref) => {
  const [dogState, setDogState] = useState<DogState>('idle');

  const translateX = useRef(new Animated.Value(0)).current;
  const baseXRef = useRef<number>(initialX - size / 2);

  const scaleX = useRef(new Animated.Value(1)).current;

  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const targetXRef = useRef<number | null>(null);
  
  const prevPausedRef = useRef(paused);

  const boundaries = useMemo(() => {
    const maxX = width - size - 20;
    const minX = 20;
    return { minX, maxX };
  }, [size, 20]);

  const generateRandomX = useCallback(() => {
    if (dogState === 'paused' || paused) {
      return baseXRef.current;
    }
    
    const { minX, maxX } = boundaries;
    return Math.random() * (maxX - minX) + minX;
  }, [boundaries, dogState, paused]);

  const generateRandomIdleDuration = useCallback(() => {
    return (Math.floor(Math.random() * 3) + 1) * 1000;
  }, []);

  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  useEffect(() => {
    translateX.setOffset(baseXRef.current);
    translateX.setValue(0);
  }, [translateX]);

  const startWalking = useCallback((providedTargetX?: number) => {
    if (dogState === 'paused' || paused) return;

    clearIdleTimer();

    const targetX = (
      typeof providedTargetX === 'number' && !Number.isNaN(providedTargetX)
    ) ? providedTargetX : generateRandomX();

    if (targetX === baseXRef.current) {
      return;
    }

    targetXRef.current = targetX;

    const currentX = baseXRef.current;
    const delta = targetX - currentX;
    const distance = Math.abs(delta);
    const duration = Math.max(250, Math.round((distance / 10) * 1000));

    scaleX.setValue(delta > 0 ? -1 : 1);

    setDogState('walking');

    translateX.setValue(0);

    const anim = Animated.timing(translateX, {
      toValue: delta,
      duration,
      useNativeDriver: true,
    });

    currentAnimationRef.current = anim;

    anim.start(({ finished }) => {
      currentAnimationRef.current = null;

      if (finished) {
        baseXRef.current = targetX;
        translateX.setOffset(baseXRef.current);
        translateX.setValue(0);
        targetXRef.current = null;

        setDogState('idle');

        if (autoWalk && !paused) {
          idleTimer.current = setTimeout(() => {
            startWalking();
          }, generateRandomIdleDuration());
        }
      }
    });
  }, [dogState, generateRandomX, translateX, scaleX, autoWalk, clearIdleTimer, paused]);

  const pauseMovement = useCallback(() => {
    clearIdleTimer();
    
    if (currentAnimationRef.current) {
      try { 
        currentAnimationRef.current.stop(); 
      } catch (error) {
        console.warn('Error stopping animation:', error);
      }
      currentAnimationRef.current = null;
    }

    translateX.stopAnimation(() => {
      setDogState('paused');
    });
  }, [translateX, clearIdleTimer]);

  useEffect(() => {
    if (prevPausedRef.current === paused) return;
    
    prevPausedRef.current = paused;
    
    if (paused) {
      clearIdleTimer();
      if (dogState === 'walking') {
        pauseMovement();
      } else if (dogState === 'idle') {
        setDogState('paused');
      }
    } else {
      setTimeout(() => {
        setDogState((currentState) => {
          if (currentState === 'paused') {
            return 'idle';
          }
          return currentState;
        });
      }, 0);
    }
  }, [paused, pauseMovement, clearIdleTimer]);

  useEffect(() => {
    if (autoWalk && dogState === 'idle' && !paused) {
      idleTimer.current = setTimeout(() => {
        if (!paused && dogState === 'idle') {
          startWalking();
        }
      }, generateRandomIdleDuration());
    }
    return clearIdleTimer;
  }, [autoWalk, dogState, paused, startWalking, clearIdleTimer, generateRandomIdleDuration]);

  useEffect(() => () => {
    clearIdleTimer();
    if (currentAnimationRef.current) {
      try { 
        currentAnimationRef.current.stop(); 
      } catch (error) {
        console.warn('Error stopping animation on unmount:', error);
      }
      currentAnimationRef.current = null;
    }
  }, [clearIdleTimer]);

  const dogContainerStyle = useMemo(
    () => [
      styles.dogContainer,
      {
        top: initialY - size / 2,
        width: size,
        height: size,
        transform: [
          { translateX },
          { scaleX },
        ],
      },
    ],
    [translateX, scaleX, initialY, size]
  );

  const lottieRef = useRef<LottieView | null>(null);
  useEffect(() => {
    if (!lottieRef.current) return;
    if (paused || dogState !== 'walking') {
      lottieRef.current.pause();
    } else if (dogState === 'walking' && !paused) {
      lottieRef.current.play();
    }
  }, [dogState, paused]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View ref={ref} style={dogContainerStyle}>
        <LottieView
          ref={(r) => (lottieRef.current = r)}
          source={source}
          autoPlay={false}
          loop
          style={{ width: size, height: size }}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'box-none',
  },
  dogContainer: {
    position: 'absolute',
    zIndex: 10,
    elevation: 4,
  },
});