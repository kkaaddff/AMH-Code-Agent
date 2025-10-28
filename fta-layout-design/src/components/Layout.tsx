import React from "react";
import { Layout as AntLayout, Breadcrumb, Typography, Space } from "antd";
import { HomeOutlined, FileTextOutlined, ToolOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbItems = [
    {
      title: "首页",
      href: "/",
      icon: <HomeOutlined />,
    },
    {
      title: "布局编辑器",
      href: "/editor",
      icon: <EditOutlined />,
    },
    {
      title: "需求理解",
      href: "/requirements",
      icon: <FileTextOutlined />,
    },
    {
      title: "技术方案",
      href: "/technical",
      icon: <ToolOutlined />,
    },
    // {
    //   title: "Prompt Editor Demo",
    //   href: "/prompt-editor-demo",
    //   icon: <ToolOutlined />,
    // },
  ];

  const handleBreadcrumbClick = (href: string) => {
    navigate(href);
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          backgroundColor: "rgb(26, 26, 26)",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Space>
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "rgb(22, 119, 255)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "rgb(255, 255, 255)", fontSize: "16px", fontWeight: "bold" }}>FTA</span>
            </div>
            <Title level={4} style={{ color: "rgb(255, 255, 255)", margin: 0, marginRight: "20px" }}>
              智能体
            </Title>
          </Space>
          <Breadcrumb
            items={breadcrumbItems.map((item) => ({
              title: (
                <span
                  style={{
                    color: location.pathname === item.href ? "rgb(22, 119, 255)" : "rgb(255, 255, 255)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onClick={() => handleBreadcrumbClick(item.href)}
                >
                  {item.icon}
                  {item.title}
                </span>
              ),
            }))}
            separator={<span style={{ color: "rgb(255, 255, 255)" }}>/</span>}
            style={{
              color: "rgb(255, 255, 255)",
              flex: 1,
            }}
          />
        </div>
      </Header>

      <Content style={{ backgroundColor: "rgb(255, 255, 255)", height: "calc(100vh - 64px)", overflow: "auto" }}>
        {children}
      </Content>
    </AntLayout>
  );
};

export default Layout;
