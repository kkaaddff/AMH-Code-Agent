import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 处理 /index.html 路径的重定向组件
 * 保留查询参数并重定向到根路径 /
 */
export const IndexHtmlRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 构建新的路径，保留查询参数和 hash
    const newPath = `/internal/projects${location.search}${location.hash}`;
    navigate(newPath, { replace: true });
  }, [location.search, location.hash, navigate]);

  return null;
};
