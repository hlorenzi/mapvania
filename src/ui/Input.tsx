import * as Solid from "solid-js"
import { styled } from "solid-styled-components"


const StyledInput = styled.input<{
    fullWidth: boolean,
}>`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #2d2d2d;

    justify-self: stretch;
    width: 4em;

    ${ props => props.fullWidth ? "width: 100%;" : "" }

    box-sizing: border-box;
    border: 1px solid var(--dockable-panelInactiveBorder);
    outline: none;
    border-radius: 0;

    padding: 0.25em 0.5em;

    &[disabled]
    {
        opacity: 0.5;
    }

    &:hover
    {
        border: 1px solid var(--dockable-panelActiveBorder);
    }

    &:focus
    {
        outline: none;
        border: 1px solid var(--dockable-panelActiveBorder);
    }
`


export function Input(props: {
    id?: string,
    number?: boolean,
    initialValue?: string,
    valueSignal?: Solid.Signal<string>,
    onChange?: (newValue: string) => void,
    onChangeNumber?: (newValue: number) => void,
    placeholder?: string,
    disabled?: boolean,
    dontManage?: boolean,
    onlyOnBlur?: boolean,
    onKeyDown?: (ev: any) => void,
    lang?: string,
    ariaLabel?: string,
    autoComplete?: string,
    autoCorrect?: string,
    autoCapitalize?: string,
    spellCheck?: boolean,
    fullWidth?: boolean,
    style?: Solid.JSX.CSSProperties,
})
{
    const onChange = (ev: any) =>
    {
        const newValue = ev.target.value as string
        
        props.valueSignal?.[1](newValue)

        if (props.onChange && !props.onlyOnBlur)
            props.onChange(newValue)

        if (props.onChangeNumber && props.number && !props.onlyOnBlur && newValue !== "")
        {
            const newValueNumber = parseFloat(newValue)
            if (isFinite(newValueNumber))
                props.onChangeNumber(newValueNumber)
        }
    }


    /*React.useEffect(() =>
    {
        if (props.dontManage)
            return
        
        if (!inputRef.current)
            return
        
        const hasFocus =
            inputRef.current && document.activeElement === inputRef.current
        
        //console.log(hasFocus, value, propValue)
    
        if (!hasFocus)
            setValue(propValue)

    }, [inputRef.current, value, propValue, needsRefresh])*/


    return <StyledInput
        id={ props.id }
        //ref={ inputRef }
        value={ props.valueSignal ? props.valueSignal[0]() : props.initialValue }
        onChange={ onChange }
        onKeyDown={ props.onKeyDown }
        placeholder={ props.placeholder }
        disabled={ props.disabled }
        lang={ props.lang }
        aria-label={ props.ariaLabel }
        auto-complete={ props.autoComplete }
        auto-correct={ props.autoCorrect }
        auto-capitalize={ props.autoCapitalize }
        spell-check={ props.spellCheck }
        fullWidth={ !!props.fullWidth }
        style={ props.style }
    />
}