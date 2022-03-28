import 'core-js/actual'

import { createPlayerWrapper, createTivio, PlayerWrapperEventType, getProgramTimestamps } from '@tivio/sdk-js'

import type { Conf, Api, Source, AdMetadata } from '@tivio/sdk-js'

// =============== Tivio initialization, getting player wrapper, registering listeners ===============

const tivio = createTivio()

const conf: Conf = {
    secret: 'XXXXXXXXX', // TODO: replace with your secret
    enableSentry: false,
}

const tivioPlayerWrapper = createPlayerWrapper({
    setSource: (source: Source | null) => {
        console.log(`Received source from Tivio: ${source?.uri}`)
        internalPlayerImplementation.setSource(source)
    },
    seekTo: (ms: number) => {
        console.log(`Received seek from Tivio: ${ms} ms`)
        internalPlayerImplementation.seekTo(ms)
    },
})

tivioPlayerWrapper.addEventListener(PlayerWrapperEventType.adMetadata, adMetadataListener)

tivio(conf)
    .then(async (api: Api) => {
        console.log(`Tivio API: ${api}`)

        if (!api) {
            console.error('Initialization failed.')
            return
        }

        if (api.error) {
            console.error(`Tivio init error: ${api.error}`, )
            return
        }

        console.log('Initialization OK')
    })
    .catch((error) => {
        console.log('Something wrong')
        console.error(error)
    })


let lastMs: number

function registerVideoListeners() {
    videoElement?.addEventListener('timeupdate', e => {
        const ms = Number(videoElement?.currentTime) * 1000

        if (!lastMs || Math.abs(ms - lastMs) > 900) {
            lastMs = ms
            console.log(`Signalling timeupdate to Tivio ${ms} ms`)
            tivioPlayerWrapper.reportTimeProgress(ms)
        }

    })

    videoElement?.addEventListener('ended', () => {
        console.log('Signalling playback ended to Tivio')

        tivioPlayerWrapper.reportPlaybackEnded()
    })

    videoElement?.addEventListener('error', () => {
        console.log('Signalling error to Tivio')

        tivioPlayerWrapper.reportError(new Error('Failed to play'))
    })
}

function getDynamicElements() {
    return {
        subType: document.getElementById('subType'),
        order: document.getElementById('order'),
        totalCount: document.getElementById('totalCount'),
        secondsToSkippable: document.getElementById('secondsToSkippable'),
        secondsToEnd: document.getElementById('secondsToEnd'),
        canSkip: document.getElementById('canSkip'),
        isSkippable: document.getElementById('isSkippable'),
        skip: document.getElementById('skip'),
        programTimestamps: document.getElementById('programTimestamps'),
    } as {[key: string]: HTMLElement | HTMLButtonElement}
}

let dynamicElements: {[key: string]: HTMLElement | HTMLButtonElement}

function adMetadataListener(adMetadata: AdMetadata) {
    console.log('AdMetadata: ', adMetadata)

    if (adMetadata) {
        dynamicElements.subType.innerHTML = adMetadata.subType
        dynamicElements.order.innerHTML = typeof adMetadata.order === 'number'
            ? adMetadata.order.toString()
            : 'N/A'
        dynamicElements.totalCount.innerHTML = typeof adMetadata.totalCount === 'number'
            ? adMetadata.totalCount.toString()
            : 'N/A'
        dynamicElements.secondsToSkippable.innerHTML = typeof adMetadata.secondsToSkippable === 'number'
            ? adMetadata.secondsToSkippable.toString()
            : 'N/A'
        dynamicElements.secondsToEnd.innerHTML = adMetadata.secondsToEnd.toString()
        dynamicElements.canSkip.innerHTML = adMetadata.canTriggerSkip ? 'true' : 'false'
        dynamicElements.isSkippable.innerHTML = adMetadata.isSkippable ? 'true' : 'false'
        dynamicElements.skip.onclick = adMetadata.canTriggerSkip ? adMetadata.skip : () => {}
        (dynamicElements.skip as HTMLButtonElement).disabled = adMetadata.canTriggerSkip ? false : true
    } else {
        dynamicElements.subType.innerHTML = ''
        dynamicElements.order.innerHTML = ''
        dynamicElements.totalCount.innerHTML = ''
        dynamicElements.secondsToSkippable.innerHTML = ''
        dynamicElements.secondsToEnd.innerHTML = ''
        dynamicElements.canSkip.innerHTML = ''
        dynamicElements.isSkippable.innerHTML = ''
        dynamicElements.skip.onclick = () => {}
        (dynamicElements.skip as HTMLButtonElement).disabled = true
    }
}

// =============== Internal player implementation + player implementation ===============

let videoElement: HTMLVideoElement | null = null

let internalPlayerImplementation: InternalPlayerImplementation
let playerImplementation: PlayerImplementation

window.onload = () => {
    internalPlayerImplementation = new InternalPlayerImplementation()
    playerImplementation = new PlayerImplementation()
    videoElement = document.getElementsByTagName('video')[0]
    registerVideoListeners()
    dynamicElements = getDynamicElements()
}

/**
 * Internal player implementation which handles low-level player
 */
class InternalPlayerImplementation {
    _prefix = 'InternalPlayerImplementation'

    play() {
        console.log(`${this._prefix}: play`)

        videoElement?.play()
    }
    pause() {
        console.log(`${this._prefix}: pause`)

        videoElement?.pause()
    }
    seekTo(ms: number) {
        console.log(`${this._prefix}: seekTo`)

        const seconds = ms / 1000

        if (videoElement) {
            videoElement.currentTime = seconds
        }
    }
    resetVideo() {
        console.log(`${this._prefix}: resetVideo`)

        videoElement?.pause()
        videoElement?.removeAttribute('src')
        videoElement?.load()
    }
    setSource(source: Source | null) {
        console.log(`${this._prefix}: setSource`)

        if (!source) {
            return
        }

        this.resetVideo()

        if (videoElement) {
            videoElement.src = source.uri

            if ('startFromPosition' in source && source.startFromPosition) {
                // TODO use seekTo
                videoElement.currentTime = source.startFromPosition / 1000
            }
        }

        this.play()
    }
}

/**
 * Player implementations which should be used in the whole app.
 * Note that setSource and seekTo have to use tivioPlayerWrapper.
 */
class PlayerImplementation {
    _prefix = 'PlayerImplementation'

    play() {
        console.log(`${this._prefix}: play`)
        internalPlayerImplementation.play()
    }
    pause() {
        console.log(`${this._prefix}: pause`)
        internalPlayerImplementation?.pause()
    }
    seekTo(ms: number) {
        console.log(`${this._prefix}: seekTo: seeking to position ${ms} through tivioPlayerWrapper`)
        tivioPlayerWrapper.seekTo(ms)
    }
    setSource(source: Source | null) {
        console.log(`${this._prefix}: setSource: setting source through tivioPlayerWrapper`)
        tivioPlayerWrapper.setSource(source)
    }
}

// =============== UI buttons handling ===============

// @ts-ignore
window.unpauseVideo = () => {
    console.log('onClick: unpausing video')
    playerImplementation.play()
}

// @ts-ignore
window.pauseVideo = () => {
    console.log('onClick: pausing video')
    playerImplementation.pause()
}

// @ts-ignore
window.jump = (stepMs: number) => {
    const ms = Number(videoElement?.currentTime) * 1000 + stepMs
    console.log(`onClick: seeking to ${ms}`)
    playerImplementation.seekTo(ms)
}

const EPG_FROM = new Date('2022-02-16T12:00:00')
const EPG_TO = new Date('2022-02-16T13:40:00')

// @ts-ignore
window.setSourceTivio = () => {
    console.log('onClick: setting source')

    const START_OVERLAP = 1000 * 60 * 2
    const streamStart = new Date(EPG_FROM.getTime() - START_OVERLAP)

    const source: Source | null = {
        type: 'tv_program',
        // TODO replace with your TV program video URI
        uri: 'https://firebasestorage.googleapis.com/v0/b/tivio-production-input-admin/o/organizations%2Fl0Q4o9TigUUTNe6TYAqR%2Fchannels%2FhL1LtUhcsZuygmi1HjJI%2Fsections%2FNQlUj81wIf0Ev6qQzRIs%2Fvideos%2F2hAoiSigTZ6Q4QyAsWAi.mp4?alt=media&token=041e129c-c034-42c5-8db0-9fb13c0e8d4e',
        tvMode: 'timeshift',
        // channel name
        // can also be prima hd, prima_hd, prima, Prima, PRIMA, etc.
        // we will normalize it to snake case and add '_hd' if necessary
        //
        // Currently we support the following Prima channels:
        // Prima
        // Prima COOL
        // Prima Love
        // Prima MAX
        // Prima Krimi
        // Prima Star
        channelName: 'Tivio Test',
        // In order to load markers, we need from, to
        epgFrom: EPG_FROM,
        epgTo: EPG_TO,
        streamStart,
        startFromPosition: START_OVERLAP,
        // continueFromPosition: 15 * 60 * 1000,
    }

    playerImplementation.setSource(source)
}

// @ts-ignore
window.getProgramTimestamps = async () => {
    const programTimestamps = await getProgramTimestamps('Tivio Test', EPG_FROM, EPG_TO)

    dynamicElements.programTimestamps.innerHTML = JSON.stringify(programTimestamps)
}
