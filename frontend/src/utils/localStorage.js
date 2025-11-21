// دوال موحدة للتعامل مع localStorage
export function loadSavedList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

export function saveToList(key, item) {
  const list = loadSavedList(key);
  if (!list.find(x => x.name === item.name)) {
    list.push(item);
    localStorage.setItem(key, JSON.stringify(list));
  }
  return list;
}

