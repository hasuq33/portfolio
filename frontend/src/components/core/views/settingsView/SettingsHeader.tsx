'use client';

interface SettingsHeaderProps {
    title: string;
    description?: string;
}

const SettingsHeader = ({title,description}: SettingsHeaderProps) =>{
    return(
        <div className="mb-6">
             <h1 className="text-2xl font-semibold">{title}</h1>
             {description && (
                <p className="text-muted-foreground mt-1">
                    {description}
                    </p>
            )}
        </div>
    )
}

export default SettingsHeader;