
export const getStartAndEndDatesForFilter = (filterType, customValues = {}) => {
  let startDate, endDate;
  const now = new Date();

  switch (filterType) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'week':
      const currentDay = now.getDay();
      const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
      const firstDayOfWeek = new Date(new Date(now).setDate(diff));
      startDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      endDate = new Date(lastDayOfWeek.setHours(23, 59, 59, 999));
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'customDate':
      startDate = new Date(customValues.customDate);
      startDate.setHours(0,0,0,0);
      endDate = new Date(customValues.customDate);
      endDate.setHours(23,59,59,999);
      break;
    case 'customMonth':
      const [yearM, monthM] = customValues.customMonth.split('-').map(Number);
      startDate = new Date(yearM, monthM - 1, 1);
      endDate = new Date(yearM, monthM, 0, 23, 59, 59, 999);
      break;
    case 'customYear':
      const yearY = parseInt(customValues.customYear);
      startDate = new Date(yearY, 0, 1);
      endDate = new Date(yearY, 11, 31, 23, 59, 59, 999);
      break;
    case 'all':
    default:
      startDate = null;
      endDate = null;
      break;
  }
  return { startDate, endDate };
};
