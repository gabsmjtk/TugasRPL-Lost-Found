export interface ReportItem {
  Title: string;
  Type: string;
  CategoryId?: string;
}

export const filterReports = <T extends ReportItem>(
  items: T[],
  searchKeyword: string,
  selectedType: string,
  selectedCategory: string
): T[] => {
  return items.filter((item) => {
    const matchesSearch = item.Title.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = selectedType ? item.Type === selectedType : true;
    const matchesCategory = selectedCategory ? item.CategoryId === selectedCategory : true;
    return matchesSearch && matchesType && matchesCategory;
  });
};
