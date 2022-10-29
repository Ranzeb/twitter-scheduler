import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { Auth } from "aws-amplify";
import Box from "@mui/material/Box";
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MailIcon from '@mui/icons-material/Mail';
import Toolbar from '@mui/material/Toolbar';
import "./sidebar.css";
import AccountMenu from '../AccountIcon/Accounticon';
import { checkValidSubscription } from "../../utils/billing_utils";
import { useGetUser } from "../../hooks/useSyncUser";
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

//TODO might need to set it in some relative measure + minWidth/maxWidth, because on large/small screens it might look strange
const drawerWidth = 160;
const fontSize = 12;

const Sidebar = (props) => {
    let navigate = useNavigate();
    const { getUser, getUserData, getUserLoading, getUserError } = useGetUser();
    const { window } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [subscriptionType, setSubscriptionType] = React.useState();
    const [subscriptionIsCanceled, setSubscriptionIsCanceled] = React.useState();
    const [subscriptionIsActive, setSubscriptionIsActive] = React.useState();

    async function signOut() {
        try {
            console.log("sign")
            await Auth.signOut();
            navigate('/goodbye')
        } catch (error) {
            console.log('error signing out: ', error);
        }
    }

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        getUser().then((response) => {
            const cognitoUser = response.data.getCognitoUser;
            checkValidSubscription(cognitoUser)
                .then((result) => {
                    if (result.subscriptionType === 'Trial') {
                        setSubscriptionType(result.subscriptionType)
                    }
                    if (result.subscriptionStatus === 'canceled') {
                        setSubscriptionIsCanceled(true)
                        setSubscriptionIsActive(false)
                    } else if (result.subscriptionStatus === 'active') {
                        setSubscriptionIsCanceled(false);
                        setSubscriptionIsActive(true)
                    }
                })
                .catch((error) => {
                    //TODO handle error, after figuring out which error just happened
                    console.log("handle error")
                    console.log(error)
                })
        })
    }, [])

    function subscriptionText() {
        if (subscriptionType === 'Trial') {
            return 'Trial'
        }
        if (subscriptionIsCanceled) {
            return 'Canceled'
        }
        if (subscriptionIsActive) {
            return 'Active'
        }
        return 'Inactive';
    }

    const drawer = (
        <div className='sidebar-header'>
            <Toolbar>
                <div id="twitter-icon">
                    Logo
                </div>
                <div id="account-icon">
                    <AccountMenu signOut={signOut} />
                </div>
            </Toolbar>
            <Divider />
            <Box sx={{ justifyContent: 'center', textAlign: 'center' }}>
                {'Subscription:\n' + subscriptionText()}
            </Box>
            <Divider />
            <List>
                <NavLink exact="true" to="/" activeclassname="activeClicked">
                    <ListItem key="Create" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <InboxIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Create" />
                        </ListItemButton>
                    </ListItem>
                </NavLink>
                <NavLink exact="true" to="/queue" activeclassname="activeClicked">
                    <ListItem key="Queue" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <MailIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Queue" />
                        </ListItemButton>
                    </ListItem>
                </NavLink>
                <NavLink exact="true" to="/statistics" activeclassname="activeClicked">
                    <ListItem key="Statistics" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <QueryStatsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Statistics" />
                        </ListItemButton>
                    </ListItem>
                </NavLink>
            </List>
        </div>
    );

    const container = window !== undefined ? () => window().document.body : undefined;
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar id="mobile-nav-header">
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{
                    width: { sm: drawerWidth },
                    flexShrink: { sm: 0 },
                }}
                aria-label="mailbox folders"
            >
                {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                <Drawer
                    container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        fontSize: fontSize,
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
        </Box>
    );
};

export default Sidebar;