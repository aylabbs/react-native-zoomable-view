import React, { useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

export const NewReactNativeZoomableView = ({ children }) => {
  const dragOffset = { x: useSharedValue(0), y: useSharedValue(0) };
  const dragStart = { x: useSharedValue(0), y: useSharedValue(0) };

  const dragGesture = Gesture.Pan()
    .averageTouches(true)
    .maxPointers(1)
    .onBegin(() => {})
    .onUpdate((e) => {
      'worklet';
      dragOffset.x.value = e.translationX + dragStart.x.value;
      dragOffset.y.value = e.translationY + dragStart.y.value;
    })
    .onEnd(() => {
      'worklet';
      dragStart.x.value = dragOffset.x.value;
      dragStart.y.value = dragOffset.y.value;
    });

  const pinchStart = { x: useSharedValue(0), y: useSharedValue(0) };
  const pinchPosition = { x: useSharedValue(0), y: useSharedValue(0) };

  const startPinchTranslate = { x: useSharedValue(0), y: useSharedValue(0) };
  const pinchTranslation = { x: useSharedValue(0), y: useSharedValue(0) };

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const zoomGesture = Gesture.Pinch()
    .onBegin((event) => {
      'worklet';
      pinchStart.x.value = event.focalX - startPinchTranslate.x.value;
      pinchStart.y.value = event.focalY - startPinchTranslate.y.value;
    })
    .onUpdate((event) => {
      'worklet';

      pinchPosition.x.value = event.focalX - pinchStart.x.value;
      pinchPosition.y.value = event.focalY - pinchStart.y.value;

      // Add this translation to the original pinch translation
      pinchTranslation.x.value =
        startPinchTranslate.x.value + pinchPosition.x.value;
      pinchTranslation.y.value =
        startPinchTranslate.y.value + pinchPosition.y.value;

      // Multiply the scale
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      'worklet';

      savedScale.value = scale.value;
      startPinchTranslate.x.value = pinchTranslation.x.value;
      startPinchTranslate.y.value = pinchTranslation.y.value;
    });

  const [layout, setLayout] = useState({ height: 10, width: 10 });

  const animatedStyles = useAnimatedStyle(() => {
    const { width, height } = layout;
    const pinchX = pinchStart.x.value / width;
    const pinchY = pinchStart.y.value / height;

    return {
      transform: [
        // pinch
        { translateX: width * (pinchX - 0.5) },
        { translateY: width * (pinchY - 0.5) },
        { scale: scale.value },
        { translateY: width * (0.5 - pinchY) },
        { translateX: width * (0.5 - pinchX) },

        // pinch-drag translation
        { translateX: pinchTranslation.x.value / scale.value },
        { translateY: pinchTranslation.y.value / scale.value },

        // drag
        { translateX: dragOffset.x.value / scale.value },
        { translateY: dragOffset.y.value / scale.value },
      ],
    };
  }, [pinchStart, pinchTranslation, layout]);

  return (
    <GestureDetector gesture={Gesture.Simultaneous(zoomGesture, dragGesture)}>
      <Animated.View onLayout={(e) => setLayout(e.nativeEvent.layout)}>
        <Animated.View style={animatedStyles}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};