import { MicVAD, defaultRealTimeVADOptions } from "@ricky0123/vad-web"
import type { RealTimeVADOptions } from "@ricky0123/vad-web"
import { useEffect, useReducer, useState } from "react"

interface ReactOptions {
  startOnLoad: boolean
  userSpeakingThreshold: number
}

export type ReactRealTimeVADOptions = RealTimeVADOptions & ReactOptions & {enable: boolean}

const defaultReactOptions: ReactOptions = {
  startOnLoad: true,
  userSpeakingThreshold: 0.6,
}

export const defaultReactRealTimeVADOptions = {
  ...defaultRealTimeVADOptions,
  ...defaultReactOptions,
  enable: false,
}

const reactOptionKeys = Object.keys(defaultReactOptions)
const vadOptionKeys = Object.keys(defaultRealTimeVADOptions)

const _filter = (keys: string[], obj: any) => {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key]
    return acc
  }, {})
}

function useOptions(
  options: Partial<ReactRealTimeVADOptions>
): [ReactOptions, RealTimeVADOptions] {
  options = { ...defaultReactRealTimeVADOptions, ...options }
  const reactOptions = _filter(reactOptionKeys, options) as ReactOptions
  const vadOptions = _filter(vadOptionKeys, options) as RealTimeVADOptions
  return [reactOptions, vadOptions]
}

export function useMicVAD(options: Partial<ReactRealTimeVADOptions>, dependencies?: any[]) {
  const [reactOptions, vadOptions] = useOptions(options)
  const [userSpeaking, updateUserSpeaking] = useReducer(
    (state: boolean, isSpeechProbability: number) =>
      isSpeechProbability > reactOptions.userSpeakingThreshold,
    false
  )
  const deps = dependencies || [];
  const enable = options.enable;
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState<false | { message: string }>(false)
  const [listening, setListening] = useState(false)
  const [vad, setVAD] = useState<MicVAD | null>(null)
  useEffect(() => {
    ;(async () => {
      const userOnFrameProcessed = vadOptions.onFrameProcessed
      vadOptions.onFrameProcessed = (probs) => {
        updateUserSpeaking(probs.isSpeech)
        userOnFrameProcessed(probs)
      }

      let myvad: MicVAD | null
      if (enable) {
        try {
          myvad = await MicVAD.new(vadOptions)
        } catch (e) {
          setLoading(false)
          if (e instanceof Error) {
            setErrored({ message: e.message })
          } else {
            // @ts-ignore
            setErrored({ message: e })
          }
          return
        }
      } else {
        return
      }

      setVAD(myvad)
      setLoading(false)
      if (reactOptions.startOnLoad) {
        myvad?.start()
        setListening(true)
      }
    })()
    return function cleanUp() {
      if (!loading && !errored) {
        vad?.pause()
        setListening(false)
      }
    }
  }, [enable, ...deps])
  const pause = () => {
    if (!loading && !errored) {
      vad?.pause()
      setListening(false)
    }
  }
  const start = () => {
    if (!loading && !errored) {
      vad?.start()
      setListening(true)
    }
  }
  const toggle = () => {
    if (listening) {
      pause()
    } else {
      start()
    }
  }
  return {
    listening,
    errored,
    loading,
    userSpeaking,
    pause,
    start,
    toggle,
  }
}

export { utils } from "@ricky0123/vad-web"
