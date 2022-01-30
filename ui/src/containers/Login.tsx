import React, { useState } from "react";
import styled from "styled-components";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import UserFrontend from "../frontend/user-frontend";
import { colors } from "../constants";

const Container = styled.div`
  width: 100%;
  height: 80%;

  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
`

const LoginContainer = styled.div`
  width: 400px;
  height: 300px;

  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 30px;
  padding-right: 30px;

  border: 1px solid ${colors.black};
  border-radius: 10px;
`;

const Title = styled.div`
  padding-top: 5px;
  padding-bottom: 35px;

  font-size: 36px;
`;

const ErrorLabel = styled.div`
  height: 30px;

  font-size: 14px;
`;

const Label = styled.div`
  padding-bottom: 3px;
`;

const Spacer = styled.div`
  height: 15px;
`;

const Textbox = styled.input`
  display: block;
  box-sizing: border-box;

  width: 100%;
  height: 35px;

  padding-left: 10px;
  padding-right: 10px;

  border: 1px solid ${colors.lightBlack};
  border-radius: 5px;

  font-size: 15px;
  font-family: 'Roboto', sans-serif;
  font-weight: 100;
`;

const Submit = styled.button`
  width: 100%;
  height: 40px;

  cursor: pointer;

  border: 1px solid ${colors.lightBlack};
  border-radius: 10px;

  background-color: white;

  font-size: 18px;
  font-family: 'Roboto', sans-serif;
  font-weight: 100;

  &:hover {
    background-color: ${colors.whiteHover};
  }

  &:active {
    background-color: ${colors.whiteActive};
  }
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const onSubmit = (event: any) => {
    event.preventDefault();

    pipe(
        UserFrontend.login(email, password)
      , TE.match(
            () => setError("Invalid email/password")
          , () => { window.location.href = "/"; }
        )
    )();
  }

  return (
    <Container>
      <LoginContainer>
        <Title>Sign In</Title>

        <form onSubmit={onSubmit}>
          <Label>Email:</Label>
          <Textbox type="text" onChange={(event) => setEmail(event.target.value)} required />
          <Spacer />

          <Label>Password:</Label>
          <Textbox type="password" onChange={(event) => setPassword(event.target.value)} required />
          
          <ErrorLabel>{error}</ErrorLabel>

          <Submit>Submit</Submit>
          <input type="submit" style={{ display: "none" }} />
        </form>
      </LoginContainer>
    </Container>
  );
}

export default Login;
