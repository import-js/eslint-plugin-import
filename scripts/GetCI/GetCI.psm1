function Get-CICommand {
    $arguments = [System.Collections.ArrayList]$args
    if ($env:CONFIGURATION -eq "WSL") {
        $arguments.Insert(0, "wsl");
    } else {
        if ($arguments[0] -eq "sudo") {
        $arguments.RemoveAt(0)
        }
    }
    $arguments.Insert(0, "echo");
    cmd /c $arguments[0] $arguments[1..$($arguments.Count - 1)];
}
