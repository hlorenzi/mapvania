import * as React from "react"
import styled, { keyframes } from "styled-components"


export function OverlayLoadingBar(props: {
    show: boolean,
})
{
    return !props.show ? null :
        <Root>
            <LoadingBar/>
        </Root>
}


const Root = styled.div`
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    z-index: 1;
    width: 100%;
    height: 100%;
    padding: 0.5em;
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #fff2;
    mouse-events: none;
`


const loadingBarKeyframes = keyframes`
    0%
    {
        transform: translate(-320px, 0);
        /*background-position-x: -80px;*/
    }
    100%
    {
        transform: translate(-240px, 0);
        /*background-position-x: 0px;*/
    }
`


const color1 = "#444"
const color2 = "#888"
const thickness = 10
const size = 20


const DivLoadingBar = styled.div`
    position: relative;
    width: 200%;
    height: ${ thickness }px;
    outline: none;
    background-color: transparent;
    background-size: calc(100% + 640px) 100%;
    background-repeat: repeat;
    background-image: repeating-linear-gradient(-30deg,
        ${ color1 },
        ${ color1 } ${ size }px,
        ${ color2 } ${ size + 1 }px,
        ${ color2 } ${ size * 2 - 1}px,
        ${ color1 } ${ size * 2 }px);
    animation-name: ${ loadingBarKeyframes };
    animation-duration: 0.75s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
`


export function LoadingBar()
{
    return <div style={{
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "8px",
        zIndex: 1,
        overflow: "hidden",
    }}>
        <DivLoadingBar/>
    </div>
}