import type { Source } from '@tivio/ads-js'

/**
 * Internal player implementation which handles low-level player
 */
 export class PlayerImplementation {
    _prefix = 'InternalPlayerImplementation'
    videoElement: HTMLVideoElement
    lastMs: number | null = null

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement
    }

    play() {
        console.log(`${this._prefix}: play`)

        this.videoElement.play()
    }

    pause() {
        console.log(`${this._prefix}: pause`)

        this.videoElement.pause()
    }

    seekTo(ms: number) {
        console.log(`${this._prefix}: seekTo`)

        const seconds = ms / 1000

        this.videoElement.currentTime = seconds
    }

    resetVideo() {
        console.log(`${this._prefix}: resetVideo`)

        this.videoElement.pause()
        this.videoElement.removeAttribute('src')
        this.videoElement.load()
    }

    setSource(source: Source | null) {
        console.log(`${this._prefix}: setSource`)

        if (!source) {
            return
        }

        this.resetVideo()

        this.videoElement.src = source.uri

        if ('startFromPosition' in source && source.startFromPosition) {
            // TODO use seekTo
            this.videoElement.currentTime = source.startFromPosition / 1000
        }

        this.play()
    }

    addTimeupdateListener(listener: (ms: number) => void) {
        this.videoElement.addEventListener('timeupdate', e => {
            const ms = Number(this.videoElement?.currentTime) * 1000

            if (!this.lastMs || Math.abs(ms - this.lastMs) > 900) {
                this.lastMs = ms
                console.log(`${this._prefix}: Signalling timeupdate to Tivio ${ms} ms`)
                listener(ms)
            }

        })
    }

    addEndedListener(listener: () => void) {
        this.videoElement.addEventListener('ended', () => {
            console.log(`${this._prefix}: Signalling playback ended to Tivio`)

            listener()
        })
    }

    addErrorListener(listener: (error: Error) => void) {
        this.videoElement.addEventListener('error', () => {
            console.log(`${this._prefix}: Signalling error to Tivio`)

            listener(new Error('Failed to play'))
        })
    }
}
