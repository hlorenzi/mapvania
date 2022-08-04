import * as React from "react"
import styled, { keyframes } from "styled-components"


const keyframesModalBkg = keyframes`
    0%
    {
        background-color: #0000;
    }

    100%
    {
        background-color: #0008;
    }
`


const keyframesModal = keyframes`
    0%
    {
        transform: scale(0.75);
        opacity: 0;
    }

    100%
    {
        transform: scale(1);
        opacity: 1;
    }
`


const StyledModalBkg = styled.div`
    z-index: 100;
    
    position: absolute;
    background-color: #0008;

    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    display: grid;
    grid-template: 1fr auto 1fr / 1fr auto 1fr;
    
    animation: 0.1s linear 0s 1 forwards ${ keyframesModalBkg };
`


const StyledModal = styled.div`
    grid-column: 2;
    grid-row: 2;

    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #242424;
    cursor: pointer;

    box-sizing: border-box;
    border: 1px solid transparent;
    border-radius: 0;
    outline: none;

    animation: 0.1s ease-out 0s 1 forwards ${ keyframesModal };
`


export function Modal(props: {
    open: boolean,
    setOpen: (open: boolean) => void,
    children?: React.ReactNode,
    onClose?: () => void,
    style?: React.CSSProperties,
})
{
    if (!props.open)
        return null

    const setOpen = (open: boolean) =>
    {
        if (!open)
            props.onClose?.()

        props.setOpen(open)
    }
    
	return <StyledModalBkg onClick={ () => setOpen(false) }>
        <StyledModal
            onClick={ ev => ev.stopPropagation() }
            style={ props.style }
        >
            { props.children }
        </StyledModal>
    </StyledModalBkg>
}