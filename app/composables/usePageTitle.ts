export const usePageTitle = () => {
  const pageTitle = useState<string | null>('pageTitle', () => null)

  const setPageTitle = (title: string | null) => {
    pageTitle.value = title
  }

  const clearPageTitle = () => {
    pageTitle.value = null
  }

  return {
    pageTitle,
    setPageTitle,
    clearPageTitle,
  }
}
