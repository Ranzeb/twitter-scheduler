import * as React from 'react';
import {NavLink, useNavigate} from 'react-router-dom';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import "./Accounticon.css";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PaymentIcon from '@mui/icons-material/Payment';

export default function AccountMenu(props) {
  let navigate = useNavigate();
  const routeChange = (path) =>{
    navigate(path);
  }
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center', }} >
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ fontSize: 5,
                  ml: 2
                }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        style={{
            fontSize: '10px',
        }}
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => routeChange('/settings')}>
          <ListItemIcon>
            <p className="user-icon-menu"><Settings fontSize="small" /></p>
          </ListItemIcon>
          <p className="user-icon-menu">Settings</p>
        </MenuItem>
        <MenuItem onClick={() => routeChange('/billing')}>
          <ListItemIcon>
            <p className="user-icon-menu"><PaymentIcon fontSize="small" /></p>
          </ListItemIcon>
          <p className="user-icon-menu">Billing</p>
        </MenuItem>
        <MenuItem onClick={props.signOut}>
          <ListItemIcon>
          <p className="user-icon-menu"><Logout fontSize="small" /></p>
          </ListItemIcon>
          <p className="user-icon-menu">Logout</p>
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}