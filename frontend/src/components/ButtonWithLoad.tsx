import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface ButtonWithLoadProps extends Omit<ButtonProps, 'children'> {
    loading: boolean;
    buttonText: string;
    loadingText?: string;
    spinnerSize?: number;
}

const ButtonWithLoad: React.FC<ButtonWithLoadProps> = ({
    loading,
    buttonText,
    loadingText,
    spinnerSize = 20,
    disabled,
    sx,
    ...otherProps
}) => {
    return (
        <Button
                variant="contained"
            disabled={disabled || loading}
            sx={{
                position: 'relative',
                ...sx
            }}
            {...otherProps}
        >
            {loading ? (
                <>
                    <CircularProgress
                        size={spinnerSize}
                        color="inherit"
                        sx={{ marginRight: 1 }}
                    />
                    {loadingText || `${buttonText}...`}
                </>
            ) : (
                buttonText
            )}
        </Button>
    );
};

export default ButtonWithLoad;