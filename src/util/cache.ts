type CacheItem<T> = {
    value: T
    timer: number
}


export class Cache<TKey, TValue>
{
    items = new Map<TKey, CacheItem<TValue>>()


    set(key: TKey, value: TValue)
    {
        this.items.set(key, {
            value,
            timer: 0,
        })
    }


    get(key: TKey): TValue | undefined
    {
        const item = this.items.get(key)
        if (item === undefined)
            return undefined

        item.timer = 0
        return item.value
    }


    advanceTimer(deleteIfOlderThan: number): TValue[]
    {
        const toDelete = new Set<TKey>()
        const deletedValues: TValue[] = []

        for (const [key, item] of this.items.entries())
        {
            item.timer++
            if (item.timer > deleteIfOlderThan)
            {
                toDelete.add(key)
                deletedValues.push(item.value)
            }
        }

        for (const key of toDelete)
            this.items.delete(key)

        return deletedValues
    }
}