import { React, useEffect, useState } from "react";
import { logout, refreshCredits, useNumCredits } from "../redux/UserSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  accountPath,
  workflowsPath,
  chatbotPath
} from "../constants/RouteConstants";
import { Dropdown, Navbar, Avatar, DarkThemeToggle } from "flowbite-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import { useUser, viewUser } from "../redux/UserSlice";

function MainNav(props) {
  const location = useLocation();
  let dispatch = useDispatch();
  let navigate = useNavigate();
  let user = useUser();
  console.log("user", user);
  let numCredits = useNumCredits();

  useEffect(() => {
    dispatch(viewUser());
  }, []);

  useEffect(() => {
    if (user && "id" in user) {
      // Start polling when the component mounts
      const intervalId = setInterval(() => {
        dispatch(refreshCredits());
      }, 5000); // Poll every 5 seconds

      // Clear the polling interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [user]);

  var imageUrl = null;
  if (user && "profile_pic_url" in user) {
    imageUrl = user["profile_pic_url"];
  }

  return (
    <Navbar className="bg-zinc-200 navbar-fixed" fluid rounded>
      <Navbar.Brand href="https://anote.ai/">
        {/* Image only when the theme is light  */}
        <div className="h-10 w-10 bg-center bg-contain bg-[url('../public/logo.png')] dark:bg-[url('../public/logo.png')]"></div>
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white text-[#374151]">
          Private GPT
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Dropdown
          theme={{
            arrowIcon: "text-[#374151] dark:text-[#9BA3AF] ml-2 h-4 w-4",
          }}
          inline
          label={
            imageUrl == "" ? (
              <Avatar rounded></Avatar>
            ) : (
              <Avatar img={imageUrl} rounded></Avatar>
            )
          }
        >
          <Dropdown.Header>
            {user && user.name && (
              <span className="block text-sm">{user.name}</span>
            )}
            <span className="block truncate text-sm font-medium">
              {numCredits} Credits Remaining
              <FontAwesomeIcon icon={faCoins} className="ml-2" />
            </span>
          </Dropdown.Header>
          <Dropdown.Item onClick={() => navigate(accountPath)}>
            Account
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item
            onClick={() =>
              dispatch(logout()).then((resp) => {
                navigate("/");
                props.setIsLoggedInParent(false);
              })
            }
          >
            Sign out
          </Dropdown.Item>
        </Dropdown>
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        <Navbar.Link active={location.pathname === chatbotPath} href={chatbotPath}>
          Chat
        </Navbar.Link>
        <Navbar.Link active={location.pathname === workflowsPath} href={workflowsPath}>
          Workflows
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default MainNav;
