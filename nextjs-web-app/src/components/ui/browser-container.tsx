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
    props.theme === "dark" ? "1px solid #373a40" : "1px solid #d1d5db"};
`;

const Header = styled.div`
  background: #1a1b1e;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #2c2e33;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  justify-content: space-between;
  min-height: 36px;

  @media (min-width: 640px) {
    padding: 8px 16px;
    gap: 8px;
    min-height: 40px;
  }
`;

const CircleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
  min-width: 60px;
`;

const Circle = styled.div<{ color: string; $clickable?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  opacity: 0.9;
  transition: all 0.15s ease;
  cursor: ${(props) => props.$clickable ? 'pointer' : 'default'};

  @media (min-width: 640px) {
    width: 12px;
    height: 12px;
  }

  &:hover {
    opacity: 1;
    transform: scale(${(props) => props.$clickable ? '1.2' : '1.1'});
  }
`;

const Title = styled.div<{ theme: "light" | "dark" }>`
  color: ${(props) => (props.theme === "dark" ? "#e2e8f0" : "#f8fafc")};
  font-size: 11px;
  font-weight: 500;
  opacity: 0.8;
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 640px) {
    font-size: 13px;
  }
`;

const Content = styled.div<{ theme: "light" | "dark" }>`
  padding: 0;
  flex: 1;
  overflow: auto;
  height: 100%;
  background: ${(props) => (props.theme === "dark" ? "#1e2939" : "#ffffff")};
`;

interface BrowserContainerProps {
  children: React.ReactNode;
  theme: "light" | "dark";
  title?: string;
  onMaximize?: () => void;
}

export const BrowserContainer = ({
  children,
  theme,
  title,
  onMaximize,
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
          <Circle
            color="#28C840"
            $clickable={!!onMaximize}
            onClick={onMaximize}
          />
        </CircleContainer>
        {title && <Title theme={theme}>{title}</Title>}
        <div style={{ width: '60px' }}></div> {/* Spacer for balance */}
      </Header>
      <Content theme={theme}>{children}</Content>
    </Container>
  );
};
