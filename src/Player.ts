import { createPlayerWrapper, PlayerWrapperEventType } from '@tivio/ads-js'

import { PlayerImplementation } from './PlayerImplementation'

import type { Source, ListenerAdMetadata, TivioPlayerWrapper } from '@tivio/ads-js'


/**
 * Player implementations which should be used in the whole app.
 * Note that setSource and seekTo have to use tivioPlayerWrapper.
 */
 export class Player {
    _prefix = 'Player'
    playerImplementation: PlayerImplementation
    tivioPlayerWrapper: TivioPlayerWrapper

    constructor(videoElement: HTMLVideoElement) {
        this.playerImplementation = new PlayerImplementation(videoElement)

        this.tivioPlayerWrapper = createPlayerWrapper({
            setSource: (source: Source | null) => {
                console.log(`${this._prefix}: Received source from Tivio: ${source?.uri}`)
                this.playerImplementation.setSource(source)
            },
            seekTo: (ms: number) => {
                console.log(`${this._prefix}: Received seek from Tivio: ${ms} ms`)
                this.playerImplementation.seekTo(ms)
            },
        }) as TivioPlayerWrapper

        this.playerImplementation.addEndedListener(this.tivioPlayerWrapper.reportPlaybackEnded)
        this.playerImplementation.addTimeupdateListener(this.tivioPlayerWrapper.reportTimeProgress)
        this.playerImplementation.addErrorListener(this.tivioPlayerWrapper.reportError)
    }

    play() {
        console.log(`${this._prefix}: play`)
        this.playerImplementation.play()
    }
    pause() {
        console.log(`${this._prefix}: pause`)
        this.playerImplementation?.pause()
    }
    seekTo(ms: number) {
        console.log(`${this._prefix}: seekTo: seeking to position ${ms} through tivioPlayerWrapper`)
        this.tivioPlayerWrapper.seekTo(ms)
    }
    setSource(source: Source | null) {
        console.log(`${this._prefix}: setSource: setting source through tivioPlayerWrapper`)
        this.tivioPlayerWrapper.setSource(source)
    }
    addMetadataListenerListener(adMetadataListener: ListenerAdMetadata) {
        this.tivioPlayerWrapper.addEventListener(PlayerWrapperEventType.adMetadata, adMetadataListener)
    }
}
