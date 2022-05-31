export type DeepAssignable<T> = DeepAssignableInner<Required<T>>


type DeepAssignableInner<T> =
	Partial<{
		[P in keyof T]:
			T[P] extends Array<infer U> ? { [index: number]: DeepAssignable<U> } :
			T[P] extends string ? string :
			T[P] extends number ? number :
			DeepAssignable<T[P]>
	}>



function isDeepAssignableObject(value: any): boolean
{
	return typeof value === "object" && !Array.isArray(value)
}


export function deepAssign<T>(a: T, b: DeepAssignable<T>): T
{
	const newObj: { [key: string]: any } = { ...a }

	for (const [key, value] of Object.entries<any>(b as any))
	{
		if (isDeepAssignableObject(value))
		{
			if (Object.keys(value).some(k => isFinite(parseInt(k))))
			{
				let newArray: any[] = newObj[key] || []
	
				for (const [arrayKey, arrayValue] of Object.entries<any>(value))
				{
					const index = parseInt(arrayKey)
					if (isFinite(index))
					{
						while (newArray.length < index)
							newArray.push(undefined)

						newArray = [
							...newArray.slice(0, index),
							!isDeepAssignableObject(arrayValue) ?
								arrayValue :
								deepAssign(newArray[index], arrayValue),
							...newArray.slice(index + 1),
						]
					}
				}

				newObj[key] = newArray
			}
			else
			{
				newObj[key] = deepAssign(newObj[key], value)
			}
		}
		else
		{
			newObj[key] = value
		}
	}

	return newObj as T
}