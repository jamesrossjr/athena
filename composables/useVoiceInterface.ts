import { ref, computed } from 'vue'

export const useVoiceInterface = () => {
  const isSupported = ref(false)
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const transcript = ref('')
  const error = ref<string | null>(null)
  
  let recognition: any = null
  let synthesis: SpeechSynthesis | null = null
  
  // Check browser support
  const checkSupport = () => {
    if (typeof window === 'undefined') {
      isSupported.value = false
      return
    }
    
    const hasSTT = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const hasTTS = 'speechSynthesis' in window
    isSupported.value = hasSTT && hasTTS
    
    if (isSupported.value) {
      synthesis = window.speechSynthesis
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognition = new SpeechRecognition()
      setupRecognition()
    }
  }
  
  // Setup speech recognition
  const setupRecognition = () => {
    if (!recognition) return
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      isListening.value = true
      error.value = null
    }
    
    recognition.onresult = (event: any) => {
      const result = event.results[0]
      if (result.isFinal) {
        transcript.value = result[0].transcript
      }
    }
    
    recognition.onerror = (event: any) => {
      error.value = event.error
      isListening.value = false
    }
    
    recognition.onend = () => {
      isListening.value = false
    }
  }
  
  // Start listening for voice input
  const startListening = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isSupported.value || !recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }
      
      if (isListening.value || isSpeaking.value) {
        reject(new Error('Already listening or speaking'))
        return
      }
      
      transcript.value = ''
      
      recognition.onresult = (event: any) => {
        const result = event.results[0]
        if (result.isFinal) {
          transcript.value = result[0].transcript
          resolve(transcript.value)
        }
      }
      
      recognition.onerror = (event: any) => {
        error.value = event.error
        reject(new Error(event.error))
      }
      
      recognition.start()
    })
  }
  
  // Stop listening
  const stopListening = () => {
    if (recognition && isListening.value) {
      recognition.stop()
    }
  }
  
  // Speak text using TTS
  const speak = (text: string, options?: SpeechSynthesisUtterance): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!synthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }
      
      if (isSpeaking.value) {
        synthesis.cancel()
      }
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Apply options if provided
      if (options) {
        Object.assign(utterance, options)
      } else {
        // Default settings
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0
      }
      
      utterance.onstart = () => {
        isSpeaking.value = true
      }
      
      utterance.onend = () => {
        isSpeaking.value = false
        resolve()
      }
      
      utterance.onerror = (event) => {
        isSpeaking.value = false
        reject(new Error(event.error))
      }
      
      synthesis.speak(utterance)
    })
  }
  
  // Stop speaking
  const stopSpeaking = () => {
    if (synthesis && isSpeaking.value) {
      synthesis.cancel()
    }
  }
  
  // Get available voices
  const getVoices = () => {
    if (!synthesis) return []
    return synthesis.getVoices()
  }
  
  // Voice activation detection
  const setupVoiceActivation = (callback: (transcript: string) => void) => {
    if (!isSupported.value) return
    
    const activationPhrases = [
      'hey jarvis',
      'jarvis',
      'hey athena',
      'athena'
    ]
    
    const checkForActivation = async () => {
      if (isSpeaking.value || isListening.value) return
      
      try {
        const result = await startListening()
        const lower = result.toLowerCase().trim()
        
        for (const phrase of activationPhrases) {
          if (lower.includes(phrase)) {
            // Remove the activation phrase from the transcript
            const cleanTranscript = lower.replace(phrase, '').trim()
            if (cleanTranscript) {
              callback(cleanTranscript)
            } else {
              // Just the activation phrase, wait for follow-up
              await speak("Yes? How can I help you?")
              const followUp = await startListening()
              callback(followUp)
            }
            break
          }
        }
      } catch (error) {
        console.error('Voice activation error:', error)
      }
      
      // Continue listening for activation
      setTimeout(checkForActivation, 1000)
    }
    
    checkForActivation()
  }
  
  // Push-to-talk functionality
  const usePushToTalk = () => {
    const isPressed = ref(false)
    
    const startPTT = async () => {
      if (isPressed.value) return
      isPressed.value = true
      
      try {
        const result = await startListening()
        return result
      } finally {
        isPressed.value = false
      }
    }
    
    const stopPTT = () => {
      isPressed.value = false
      stopListening()
    }
    
    return {
      isPressed: readonly(isPressed),
      startPTT,
      stopPTT
    }
  }
  
  // Initialize on creation
  checkSupport()
  
  return {
    // State
    isSupported: readonly(isSupported),
    isListening: readonly(isListening),
    isSpeaking: readonly(isSpeaking),
    transcript: readonly(transcript),
    error: readonly(error),
    
    // Actions
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    getVoices,
    setupVoiceActivation,
    usePushToTalk,
    
    // Computed
    canListen: computed(() => isSupported.value && !isSpeaking.value),
    canSpeak: computed(() => isSupported.value && !isListening.value)
  }
}