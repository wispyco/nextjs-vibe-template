import styled from "styled-components";
import { motion } from "framer-motion";

const Container = styled(motion.div)<{ theme: "light" | "dark" }>`
  background: ${(props) => (props.theme === "dark" ? "#1e2939" : "#ffffff")};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: ${(props) => (props.theme === "dark" ? "#1e2939" : "#000000")};
  border: ${(props) =>
    props.theme === "dark" 
      ? "1px solid #373a40" 
      : "1px solid #d1d5db"};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    pointer-events: none;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
`;

const Header = styled.div`
  background: #1a1b1e;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #2c2e33;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  justify-content: space-between;
`;

const CircleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
  min-width: 60px;
`;

const Circle = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  opacity: 0.9;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const Title = styled.div<{ theme: "light" | "dark" }>`
  color: ${(props) => (props.theme === "dark" ? "#e2e8f0" : "#f8fafc")};
  font-size: 13px;
  font-weight: 500;
  opacity: 0.8;
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Content = styled.div<{ theme: "light" | "dark" }>`
  padding: 0;
  flex: 1;
  overflow: hidden;
  height: 100%;
  background: ${(props) => (props.theme === "dark" ? "#1e2939" : "#ffffff")};
  position: relative;
`;

interface BrowserContainerProps {
  children: React.ReactNode;
  theme: "light" | "dark";
  title?: string;
}

export const BrowserContainer = ({
  children,
  theme,
  title,
}: BrowserContainerProps) => {
  return (
    <Container
      theme={theme}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Header>
        <CircleContainer>
          <Circle color="#FF5F57" />
          <Circle color="#FFBD2E" />
          <Circle color="#28C840" />
        </CircleContainer>
        {title && <Title theme={theme}>{title}</Title>}
        <div style={{ width: '60px' }}></div> {/* Spacer for balance */}
      </Header>
      <Content theme={theme}>{children}</Content>
    </Container>
  );
};
