'use client';

interface SettingsHeaderProps {
    title: string;
    description?: string;
}

const SettingsHeader = ({title,description}: SettingsHeaderProps) =>{
    return(
        <div className="mb-6 px-1">
             <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
             {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                    </p>
            )}
        </div>
    )
}

export default SettingsHeader;
