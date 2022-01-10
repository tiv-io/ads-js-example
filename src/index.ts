import { createTivio, PlayerWrapperEventType } from '@tivio/sdk-js'

import type { Api, TivioPlayerWrapper, Source, AdMetadata } from '@tivio/sdk-js'

// =============== Tivio initialization, getting player wrapper, registering listeners ===============

const tivio = createTivio()

const conf = {
    secret: 'XXXXXXXXX', // TODO: replace with your secret
    resolverUrl: 'https://tivio-resolver.tiv.io/serveBundle/resolver3.js',
    deviceCapabilities: [],
    currency: 'EUR',
    verbose: true,
}

let tivioPlayerWrapper: TivioPlayerWrapper | null = null

tivio(conf)
    .then(async (api) => {
        console.log('Tivio API:', api)

        if (!api) {
            console.error('Initialization failed.')
            return
        }

        if (api.error) {
            console.error('Tivio init error:', api.error)
            return
        }

        console.log('Initialization OK')

        tivioPlayerWrapper = getPlayerWrapper(api) ?? null
        registerVideoListeners()

        tivioPlayerWrapper?.addEventListener(PlayerWrapperEventType.adMetadata, adMetadataListener)
    })
    .catch((error) => {
        console.log('Something wrong')
        console.error(error)
    })

function getPlayerWrapper(api: Api) {
    return api?.createPlayerWrapper?.({
        setSource: (source: Source | null) => {
            console.log('Received source from Tivio', source?.uri)
            internalPlayerImplementation.setSource(source)
        },
        seekTo: (ms: number) => {
            console.log(`Received seek from Tivio: ${ms} ms`)
            internalPlayerImplementation.seekTo(ms)
        },
    })
}

function registerVideoListeners() {
    videoElement?.addEventListener('timeupdate', e => {
        const ms = Number(videoElement?.currentTime) * 1000

        console.log(`Signalling timeupdate to Tivio ${ms} ms`)

        tivioPlayerWrapper?.reportTimeProgress(ms)
    })

    videoElement?.addEventListener('ended', () => {
        console.log('Signalling playback ended to Tivio')

        tivioPlayerWrapper?.reportPlaybackEnded()
    })

    videoElement?.addEventListener('error', () => {
        console.log('Signalling error to Tivio')

        tivioPlayerWrapper?.reportLoadError(new Error('Failed to play'))
    })
}

function adMetadataListener(metadata: AdMetadata) {
    console.log('AdMetadata: ', metadata)
}

// =============== internal player implementation ===============

let videoElement: HTMLVideoElement | null = null

window.onload = () => {
    videoElement = document.getElementsByTagName('video')[0]
}

class InternalPlayerImplementation {
    play() {
        console.log('play internal')

        videoElement?.play()
    }
    pause() {
        console.log('pause internal')

        videoElement?.pause()
    }
    seekTo(ms: number) {
        console.log('seekTo internal')

        const seconds = ms / 1000

        if (videoElement) {
            videoElement.currentTime = seconds
        }
    }
    resetVideo() {
        console.log('resetVideo internal')

        videoElement?.pause()
        videoElement?.removeAttribute('src')
        videoElement?.load()
    }
    setSource(source: Source | null) {
        console.log('setSource internal')

        if (!source) {
            return
        }

        this.resetVideo()

        if (videoElement) {
            videoElement.src = source.uri
        }

        this.play()
    }
}

const internalPlayerImplementation = new InternalPlayerImplementation()

// =============== UI buttons handling ===============

// @ts-ignore
window.unpauseVideo = () => {
    console.log('Unpausing video')
    internalPlayerImplementation.play()
}

// @ts-ignore
window.pauseVideo = () => {
    console.log('Pausing video')
    internalPlayerImplementation.pause()
}

// @ts-ignore
window.jumpForward = () => {
    const ms = Number(videoElement?.currentTime) * 1000 + 2000

    console.log(`Seeking to ${ms} through tivioPlayerWrapper`)

    tivioPlayerWrapper?.seekTo(ms)
}

// @ts-ignore
window.setSourceTivio = () => {
    console.log('Setting source through tivioPlayerWrapper')

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
        channelName: 'Prima HD',
        // In order to load markers, we need from, to
        epgFrom: new Date('2022-01-10T12:00:00'),
        epgTo: new Date('2022-01-10T13:40:00'),
        positionMs: 0,
    }

    tivioPlayerWrapper?.setSource(source)
}
