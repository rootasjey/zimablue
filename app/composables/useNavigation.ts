export const useNavigation = (countMap: { [key: string]: number } = {}) => {
  return [
    {
      color: '#3D3BF3',
      count: countMap["home"] ?? 0,
      icon: '',
      subtitle: "All the illustrations I've created.",
      title: "home",
      to: '/',
    },
    {
      color: '#FAB12F',
      count: countMap["collections"] ?? 0,
      icon: '',
      subtitle: "Collections of categorized illustrations.",
      title: "collections",
      to: '/collections',
    },
    {
      color: '#CB9DF0',
      count: countMap["about"] ?? 0,
      subtitle: "Why all this even exists?",
      title: "about",
      to: '/about',
    }
  ]
}