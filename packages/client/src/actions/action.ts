type Action<T> = {
  execute: () => Promise<T>
  revert: () => void
}

export function defineOptimisticAction<T extends readonly unknown[], R>(
  callback: (...args: T) => Action<R>
): (...args: T) => Promise<[Error, null] | [null, R]> {
  return async (...args: T) => {
    const { execute, revert } = callback(...args)
    try {
      const res = await execute()
      return [null, res]
    } catch (error) {
      revert()
      return [error as Error, null]
    }
  }
}
