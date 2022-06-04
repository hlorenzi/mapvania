import * as React from "react"
import styled from "styled-components"


const StyledGrid = styled.div<{
    cols?: number,
    template?: string,
    templateRows: string,
    alignItems: string,
    maxWidth?: string,
    fullHeight: boolean,
}>`
    width: 100%;
    display: grid;

    ${ props => props.maxWidth ? `max-width: ${ props.maxWidth };` : `` }

    ${ props => props.fullHeight ?
        `
            height: 100%;
            max-height: 100%;
            min-height: 0;
            
        ` : `` }

    grid-template-rows: ${ props => props.templateRows };

    ${ props => props.template ?
        `
            grid-template-columns: ${ props.template } [main-end];
        `
        :
        `
            grid-template-columns: repeat(${ props.cols }, 1fr) [main-end];
        `
    }

    grid-auto-flow: row;
    grid-column-gap: 0.5em;
    grid-row-gap: 0.25em;
    justify-items: start;
    justify-content: start;
    justify-self: start;
    align-items: ${ props => props.alignItems };
    align-content: start;
`


export function Grid(props: {
    children?: React.ReactNode,
    cols?: number,
    template?: string,
    templateRows?: string,
    alignStart?: boolean,
    maxWidth?: string,
    fullHeight?: boolean,
})
{
    return <StyledGrid
        cols={ props.cols }
        template={ props.template }
        templateRows={ props.templateRows ?? "auto" }
        alignItems={ props.alignStart ? "start" : "baseline" }
        fullHeight={ !!props.fullHeight }
        maxWidth={ props.maxWidth }
    >
        { props.children }
    </StyledGrid>
}


const StyledCell = styled.div<{
    span: number | string,
    justifySelf: string,
    textAlign: string,
    fullHeight: boolean,
}>`
    grid-column-start: auto;
    grid-column-end: span ${ props => props.span };
    justify-self: ${ props => props.justifySelf };
    text-align: ${ props => props.textAlign };

    ${ props => props.fullHeight ?
        `
            height: 100%;
            max-height: 100%;
            min-height: 0;
            
        ` : `` }
`


const StyledDivider = styled.div`
    border-bottom: 1px solid var(--dockable-panelInactiveBorder);
    margin-bottom: 1em;
`


export function Cell(props: {
    children?: React.ReactNode,
    span?: number,
    fill?: boolean,
    justifyStart?: boolean,
    justifyCenter?: boolean,
    justifyEnd?: boolean,
    justifyStretch?: boolean,
    fullHeight?: boolean,
    divider?: boolean,
})
{
    const justifySelf =
        props.justifyStart ? "start" :
        props.justifyCenter ? "center" :
        props.justifyEnd ? "end" :
        props.justifyStretch ? "stretch" :
        "inherit"

    const textAlign =
        props.justifyCenter ? "center" :
        props.justifyEnd ? "right" :
        props.justifyStretch ? "center" :
        "inherit"

    return <StyledCell
        span={ props.span ?? (!!props.fill ? "main-end" : 1) }
        justifySelf={ justifySelf }
        textAlign={ textAlign }
        fullHeight={ !!props.fullHeight }
    >
        { props.children }
        { props.divider && <StyledDivider/> }
    </StyledCell>
}