import 'core-js/actual'

import { createTivio, getProgramTimestamps } from '@tivio/ads-js'

import { Player } from './Player'

import type { Conf, Api, Source, AdMetadata } from '@tivio/ads-js'

// =============== Tivio initialization ===============

const conf: Conf = {
    secret: 'XXXXXXXXX', // TODO: replace with your secret
    enableSentry: false,
}

createTivio(conf)
    .then(async (api: Api) => {
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
    .catch((error: Error) => {
        console.log('Something wrong')
        console.error(error)
    })

// =============== app init, creating player, registering listener ===============

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


let videoElement: HTMLVideoElement | null = null

let player: Player

window.onload = () => {
    videoElement = document.getElementsByTagName('video')[0]

    if (!videoElement) {
        throw new Error('Video element not found!');
    }

    player = new Player(videoElement)
    dynamicElements = getDynamicElements()
    player.addMetadataListenerListener(adMetadataListener)
}

// =============== UI buttons handling ===============

// @ts-ignore
window.unpauseVideo = () => {
    console.log('onClick: unpausing video')
    player.play()
}

// @ts-ignore
window.pauseVideo = () => {
    console.log('onClick: pausing video')
    player.pause()
}

// @ts-ignore
window.jump = (stepMs: number) => {
    const ms = Number(videoElement?.currentTime) * 1000 + stepMs
    console.log(`onClick: seeking to ${ms}`)
    player.seekTo(ms)
}

const EPG_FROM = new Date('2022-03-27T11:45:00')
const EPG_TO = new Date('2022-03-27T12:30:00')
const CHANNEL_NAME = "Prima"

// @ts-ignore
window.setSourceTivio = () => {
    console.log('onClick: setting source')

    const START_OVERLAP = 1000 * 60 * 2
    const streamStart = new Date(EPG_FROM.getTime() - START_OVERLAP)

    const source: Source | null = {
        type: 'tv_program',
        // TODO replace with your TV program video URI
        // (this example is program "Receptář prima nápadů" from 2022-03-27 11:45 - 12:30 at Prima TV channel)
        // HLS
        // uri: 'https://cdn3.tiv.io/tivio-production-videos-output/x720GbG3Jys0ZEdLYr2j/tOknPggQOLX6K8XlQe0K/h264/main.m3u8',
        // DASH
        uri: 'https://cdn3.tiv.io/tivio-production-videos-output/x720GbG3Jys0ZEdLYr2j/tOknPggQOLX6K8XlQe0K/h264/manifest.mpd',
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
        channelName: CHANNEL_NAME,
        // In order to load markers, we need from, to
        epgFrom: EPG_FROM,
        epgTo: EPG_TO,
        streamStart,
        startFromPosition: START_OVERLAP,
        // continueFromPosition: 15 * 60 * 1000,
    }

    player.setSource(source)
}

// @ts-ignore
window.getProgramTimestamps = async () => {
    const programTimestamps = await getProgramTimestamps(CHANNEL_NAME, EPG_FROM, EPG_TO)

    dynamicElements.programTimestamps.innerHTML = JSON.stringify(programTimestamps)
}
