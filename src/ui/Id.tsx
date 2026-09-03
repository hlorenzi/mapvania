import * as React from "react"
import styled from "styled-components"


const StyledIdButton = styled.div`
    display: inline-block;
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 0.25em;
    padding: 0.25em 0.25em;

    cursor: pointer;
    user-select: none;

    &:hover
    {
        background-color: #2d2d2d;
    }
`


const StyledId = styled.div`
    display: inline-block;
    font-size: 1.25em;
    font-family: monospace;
    color: inherit;
`


const StyledPopupWrapper = styled.div`
    display: inline-block;
    position: relative;
    top: -2em;
    left: -100%;
    width: 0;
    height: 0;
    pointer-events: none;
`


const StyledPopup = styled.div`
    display: inline-block;
    position: absolute;
    font-size: 0.75em;
    font-family: inherit;
    text-wrap: nowrap;
    text-align: center;
    color: inherit;
    pointer-events: none;
`


export function Id(props: {
    id?: string,
    style?: React.CSSProperties,
})
{
    const [iconShown, setIconShown] = React.useState(false)
    
    const onClick = async () => {
        try
        {
            await navigator.clipboard.writeText(props.id ?? "")
            setIconShown(true)
            setTimeout(() => setIconShown(false), 750)
        }
        catch (err)
        {
            window.alert("Copy to clipboard failed.")
        }
    }

    return <StyledIdButton onClick={ onClick }>
        ID <StyledId>{ props.id }</StyledId>
        { !iconShown ? null :
            <StyledPopupWrapper>
                <StyledPopup>
                    Copied ✅
                </StyledPopup>
            </StyledPopupWrapper>
        }
    </StyledIdButton>
}