import * as React from "react"
import styled from "styled-components"


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
    value?: number | string,
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
    style?: React.CSSProperties,
})
{
    const inputRef = React.useRef<HTMLInputElement>(null)

    const [needsRefresh, setNeedsRefresh] = React.useState(false)

    const propValue = props.value !== undefined ? props.value.toString() : ""

    const [value, setValue] = props.dontManage ?
        [propValue.toString(), props.onChange || (() => {})] :
        React.useState(propValue.toString())


    const onChange = (ev: any) =>
    {
        //console.log("onChange")
        const newValue: string = ev.target.value
        setValue(newValue)

        if (props.onChange && !props.onlyOnBlur)
            props.onChange(newValue)

        if (props.onChangeNumber && props.number && !props.onlyOnBlur && newValue !== "")
        {
            const newValueNumber = parseFloat(newValue)
            if (isFinite(newValueNumber))
                props.onChangeNumber(newValueNumber)
        }
    }


    const onBlur = (ev: any) =>
    {
        //console.log("onBlur")
        const newValue = ev.target.value
        setValue(newValue)

        if (props.onChange)
            props.onChange(newValue)

        setNeedsRefresh(!needsRefresh)
    }


    React.useEffect(() =>
    {
        if (props.dontManage)
            return
        
        if (!inputRef.current)
            return
        
        const hasFocus =
            inputRef.current && document.activeElement === inputRef.current
            
        //console.log(hasFocus, value, propValue.toString())
    
        if (props.onChange && !hasFocus && propValue.toString() != value)
            setValue(propValue.toString())

    }, [inputRef.current, propValue, needsRefresh])


    return <StyledInput
        id={ props.id }
        ref={ inputRef }
        value={ value }
        onChange={ onChange }
        onBlur={ onBlur }
        onKeyDown={ props.onKeyDown }
        placeholder={ props.placeholder }
        disabled={ props.disabled }
        lang={ props.lang }
        aria-label={ props.ariaLabel }
        autoComplete={ props.autoComplete }
        autoCorrect={ props.autoCorrect }
        autoCapitalize={ props.autoCapitalize }
        spellCheck={ props.spellCheck }
        fullWidth={ !!props.fullWidth }
        style={ props.style }
    />
}