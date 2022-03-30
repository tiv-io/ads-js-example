import { Player as ShakaPlayer, polyfill } from 'shaka-player'

import type { Source } from '@tivio/ads-js'

/**
 * Internal player implementation which handles low-level player
 */
 export class PlayerImplementation {
    _prefix = 'PlayerImplementation'
    videoElement: HTMLVideoElement
    lastMs: number | null = null
    shakaPlayer: ShakaPlayer

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement

        polyfill.installAll()

        if (ShakaPlayer.isBrowserSupported()) {
            this.shakaPlayer = new ShakaPlayer(videoElement)

            console.log('Shaka player created.');
        } else {
            throw new Error('Browser is not supported by Shaka Player!');
        }
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

    async setSource(source: Source | null) {
        console.log(`${this._prefix}: setSource`)

        if (!source) {
            return
        }

        await this.shakaPlayer.unload()

        if ('startFromPosition' in source && source.startFromPosition) {
            this.shakaPlayer.load(source.uri, source.startFromPosition / 1000)
        } else {
            this.shakaPlayer.load(source.uri)
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

    addDurationListener(listener: (ms: number) => void) {
        this.videoElement.addEventListener('durationchange', event => {
            listener(this.videoElement.duration * 1000)
        })
    }
}
