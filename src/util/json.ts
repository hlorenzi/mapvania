export interface StringifyOptions
{
    minimize?: boolean
    useTrailingCommas?: boolean
    useBareIdentifiers?: boolean
    sortFields?: boolean
    spacedFields?: boolean
    useMultilineArray?: boolean
}


export type Path = string[]


export type GetStringifyOptions = (
    path: Path,
    parent: any,
    value: any)
    => StringifyOptions


class StringBuilder
{
    result = ""
    indentationLevel = 0
    needsIndentation = false


    indent()
    {
        this.indentationLevel++
    }


    unindent()
    {
        this.indentationLevel--
    }


    write(str: string)
    {
        if (this.needsIndentation)
        {
            this.needsIndentation = false
            
            for (let i = 0; i < this.indentationLevel; i++)
                this.result += "\t"
        }

        this.result += str
    }


    newline()
    {
        this.result += "\n"
        this.needsIndentation = true
    }
}


export function stringify(
    data: any,
    globalOptions: StringifyOptions,
    getOptions?: GetStringifyOptions)
    : string
{
    const builder = new StringBuilder()

    stringifyAny(
        builder,
        [],
        null,
        data,
        globalOptions,
        getOptions)

    return builder.result
}


function stringifyAny(
    builder: StringBuilder,
    path: Path,
    parent: any,
    value: any,
    globalOptions: StringifyOptions,
    getOptions: GetStringifyOptions | undefined)
{
    if (value === null || value === undefined)
        stringifyNull(builder)

    else if (typeof value === "boolean")
        stringifyBoolean(builder, value)

    else if (typeof value === "number")
        stringifyNumber(builder, value)
        
    else if (typeof value === "string")
        stringifyString(builder, value)
    
    else if (Array.isArray(value))
        stringifyArray(builder, path, parent, value, globalOptions, getOptions)

    else if (typeof value === "object")
        stringifyObject(builder, path, parent, value, globalOptions, getOptions)
    
    else
        stringifyNull(builder)
}


function stringifyObject(
    builder: StringBuilder,
    path: Path,
    parent: any,
    obj: any,
    globalOptions: StringifyOptions,
    getOptions: GetStringifyOptions | undefined)
{
    const options = {
        ...globalOptions,
        ...getOptions?.(path, parent, obj) ?? {},
    }
    
    builder.write("{")

    if (!options.minimize)
        builder.indent()

    builder.newline()

    if (options.spacedFields)
        builder.newline()

    const keys = Object.keys(obj)

    if (options.sortFields)
        keys.sort((a, b) => a.localeCompare(b, "en"))

    for (const key of keys)
    {
        const value = obj[key]
        const subpath = [...path, key]

        if (options.useBareIdentifiers &&
            canRepresentAsIdentifier(key))
        {
            builder.write(key)
        }
        else
        {
            builder.write(JSON.stringify(key))
        }

        builder.write(":")

        if (!options.minimize)
            builder.write(" ")

        stringifyAny(builder, subpath, parent, value, globalOptions, getOptions)

        if (options.useTrailingCommas ||
            key !== keys[keys.length - 1])
            builder.write(",")
        
        builder.newline()
        
        if (options.spacedFields)
            builder.newline()
    }

    if (!options.minimize)
        builder.unindent()

    builder.write("}")
}


function stringifyArray(
    builder: StringBuilder,
    path: Path,
    parent: any,
    array: Array<any>,
    globalOptions: StringifyOptions,
    getOptions: GetStringifyOptions | undefined)
{
    const options = {
        ...globalOptions,
        ...getOptions?.(path, parent, array) ?? {},
    }

    builder.write("[")

    if (array.length > 0 &&
        !Array.isArray(array[0]) &&
        typeof array[0] === "object")
        options.useMultilineArray = true

    if (options.useMultilineArray)
    {
        if (!options.minimize)
            builder.indent()

        builder.newline()

        if (options.spacedFields)
            builder.newline()
    }

    for (let i = 0; i < array.length; i++)
    {
        const value = array[i]
        const subpath = [...path, i.toString()]

        stringifyAny(builder, subpath, parent, value, globalOptions, getOptions)

        if (options.useTrailingCommas ||
            i < array.length - 1)
            builder.write(",")

        if (options.useMultilineArray)
        {
            builder.newline()
            
            if (options.spacedFields)
                builder.newline()
        }
    }

    if (!options.minimize &&
        options.useMultilineArray)
        builder.unindent()

    builder.write("]")
}


function stringifyNull(
    builder: StringBuilder)
{
    builder.write("null")
}


function stringifyBoolean(
    builder: StringBuilder,
    value: boolean)
{
    builder.write(value ? "true" : "false")
}


function stringifyNumber(
    builder: StringBuilder,
    value: number)
{
    builder.write(JSON.stringify(value))
}


function stringifyString(
    builder: StringBuilder,
    value: string)
{
    builder.write(JSON.stringify(value))
}


export function canRepresentAsIdentifier(str: string)
{
    if (str.length === 0)
        return false
        
    if (!isCharBetween(str[0], "a", "z") &&
        !isCharBetween(str[0], "A", "Z") &&
        str[0] !== "_")
        return false

    for (let i = 1; i < str.length; i++)
    {
        if (!isCharBetween(str[i], "a", "z") &&
            !isCharBetween(str[i], "A", "Z") &&
            !isCharBetween(str[i], "0", "9") &&
            str[i] !== "_")
            return false
    }
    
    return true
}


class Parser
{
    str: string
    index = 0


    constructor(str: string)
    {
        this.str = str
        this.skipWhitespace()
    }


    next(nth: number = 0)
    {
        if (this.index + nth >= this.str.length)
            return "\0"
        
        return this.str.charAt(this.index + nth)
    }


    skipWhitespace()
    {
        while (true)
        {
            const c = this.next()
            if (c !== " " &&
                c !== "\t" &&
                c !== "\r" &&
                c !== "\n")
                break

            this.advance()
        }
    }


    advance()
    {
        this.index++
        this.skipWhitespace()
    }


    tryMatch(s: string): boolean
    {
        for (let i = 0; i < s.length; i++)
        {
            if (this.next(i) != s[i])
                return false
        }

        for (let i = 0; i < s.length; i++)
            this.advance()

        return true
    }


    match(s: string)
    {
        if (!this.tryMatch(s))
            throw ("expected `" + s + "`")
    }
}


export function parse(str: string): any
{
    const parser = new Parser(str)
    return parseAny(parser)
}


export function parseAny(parser: Parser): any
{
    if (parser.next() === "{")
        return parseObject(parser)

    if (parser.next() === "[")
        return parseArray(parser)

    if (parser.next() === "\"")
        return parseString(parser)

    if (isCharBetween(parser.next(), "0", "9") ||
        parser.next() === "-")
        return parseNumber(parser)

    if (parser.tryMatch("true"))
        return true

    if (parser.tryMatch("false"))
        return false

    if (parser.tryMatch("null"))
        return null

    throw "expected value"
}


export function parseObject(parser: Parser): any
{
    const result: any = {}

    parser.match("{")

    while (parser.next() !== "}")
    {
        let fieldName: string

        if (parser.next() === "\"")
            fieldName = parseString(parser)
        else
            fieldName = parseIdentifier(parser)

        parser.match(":")

        result[fieldName] = parseAny(parser)

        if (!parser.tryMatch(","))
            break
    }

    parser.match("}")
    return result
}


export function parseArray(parser: Parser): any
{
    const result: any[] = []

    parser.match("[")

    while (parser.next() !== "]")
    {
        result.push(parseAny(parser))

        if (!parser.tryMatch(","))
            break
    }

    parser.match("]")
    return result
}


export function parseString(parser: Parser): any
{
    const start = parser.index

    parser.match("\"")

    while (parser.next() !== "\"")
    {
        if (parser.next(0) === "\\" &&
            parser.next(1) === "\"")
        {
            parser.advance()
            parser.advance()
        }
        else
        {
            parser.advance()
        }
    }

    parser.match("\"")

    const end = parser.index

    const substr = parser.str.substring(start, end)
    return JSON.parse(substr)
}


export function parseIdentifier(parser: Parser): any
{
    let result = ""

    while (true)
    {
        const c = parser.next()

        if (isCharBetween(c, "a", "z") ||
            isCharBetween(c, "A", "Z") ||
            isCharBetween(c, "0", "9") ||
            c === "_")
        {
            result += c
            parser.advance()
        }
        else
            break
    }

    return result
}


export function parseNumber(parser: Parser): any
{
    let result = ""

    while (true)
    {
        const c = parser.next()

        if (isCharBetween(c, "0", "9") ||
            c === "." ||
            c === "-")
        {
            result += c
            parser.advance()
        }
        else
            break
    }

    return parseFloat(result)
}


export function isCharBetween(c: string, a: string, z: string)
{
    return (
        c.codePointAt(0)! >= a.codePointAt(0)! &&
        c.codePointAt(0)! <= z.codePointAt(0)!)
}