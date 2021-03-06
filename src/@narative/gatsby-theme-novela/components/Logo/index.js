import React from "react";
import styled from "@emotion/styled";

/**
 * Paste in your SVG logo and return it from this component.
 * Make sure you have a height set for your logo.
 * It is recommended to keep the height within 25-35px.
 */
export default function Logo({ fill = "white" }) {
  return (
    <>
      <svg
        height="35"
        viewBox="0 0 127 108"
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 3C0 1.34315 1.34315 0 3 0H49.6262C51.2831 0 52.6262 1.34315 52.6262 3V20.1429C52.6262 21.7997 51.2831 23.1429 49.6262 23.1429H26.2317C24.5749 23.1429 23.2317 24.486 23.2317 26.1429V81.8571C23.2317 83.514 24.5749 84.8571 26.2317 84.8571H49.6262C51.2831 84.8571 52.6262 86.2003 52.6262 87.8571V105C52.6262 106.657 51.2831 108 49.6262 108H3C1.34315 108 0 106.657 0 105V3Z" />
        <path
          d="M98.1747 1.94862C98.7287 1.10056 99.6732 0.589359 100.686 0.589359H121.438C123.825 0.589359 125.256 3.24238 123.945 5.23726L93.2039 52.0017C92.5524 52.9928 92.5459 54.2747 93.1874 55.2723L124.027 103.23C125.311 105.227 123.878 107.853 121.504 107.853H100.706C99.6821 107.853 98.7291 107.331 98.1778 106.468L65.4555 55.265C64.8201 54.2709 64.8265 52.9966 65.4718 52.0088L98.1747 1.94862Z"
        />
      </svg>
      <LogoText>Chris Kohler</LogoText>
    </>
  );
}

const LogoText = styled.h1`
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  padding-left: 8px;
  color: ${p => p.theme.colors.primary};
`;
