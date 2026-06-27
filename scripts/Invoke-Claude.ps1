# Fix TLS protocol issue
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

# ========== Configuration ==========
$BaseDomain = "https://right.codes"
$ApiKey = "sk-34eec74bb3c34fc88eb5bae06b8acfa6"
$AnthropicVersion = "2023-06-01"

# Tier mapping
$TierMap = @{
    "S" = @{
        Channel     = "/claude"
        Model       = "claude-opus-4-8"
        BackupModel = "claude-sonnet-4-5-20250929"
        MaxTokens   = 4096
        Temperature = 0.2
    }
    "A" = @{
        Channel     = "/claude"
        Model       = "claude-sonnet-4-5-20250929"
        BackupModel = "claude-haiku-4-5-20251001"
        MaxTokens   = 4096
        Temperature = 0.5
    }
    "B" = @{
        Channel     = "/claude"
        Model       = "claude-haiku-4-5-20251001"
        BackupModel = "claude-sonnet-4-5-20250929"
        MaxTokens   = 2048
        Temperature = 0.7
    }
}

# ========== Core Function ==========
function Invoke-AIChat {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Tier,
        [Parameter(Mandatory=$true)]
        [string]$Prompt,
        [string]$SystemPrompt = "You are a senior full-stack developer specializing in Next.js and Tailwind CSS. Respond only in Simplified Chinese. Output clean, runnable code.",
        [switch]$UseBackup = $false
    )

    if (-not $TierMap.ContainsKey($Tier)) {
        Write-Error "Invalid tier. Only S/A/B are supported."
        return $null
    }

    $config = $TierMap[$Tier]
    $channel = $config.Channel
    
    if ($UseBackup -and $config.BackupModel) {
        $model = $config.BackupModel
    } else {
        $model = $config.Model
    }

    $uri = $BaseDomain.TrimEnd('/') + $channel + "/v1/messages"

    $body = @{
        model       = $model
        max_tokens  = $config.MaxTokens
        temperature = $config.Temperature
        system      = $SystemPrompt
        messages    = @(
            @{
                role    = "user"
                content = $Prompt
            }
        )
    } | ConvertTo-Json -Depth 10

    $headers = @{
        "x-api-key"         = $ApiKey
        "anthropic-version" = $AnthropicVersion
        "Content-Type"      = "application/json"
    }

    try {
        Write-Host "[$Tier Tier] Calling model: $model" -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -Headers $headers -TimeoutSec 120
        
        if ($null -eq $response.content -or $response.content.Count -eq 0) {
            Write-Warning "Empty response received."
            return $null
        }

        $result = $response.content[0].text
        $usage = $response.usage
        
        Write-Host "Success | Input: $($usage.input_tokens) tokens | Output: $($usage.output_tokens) tokens" -ForegroundColor Green
        return [PSCustomObject]@{
            Content = $result
            Usage   = $usage
            Model   = $model
            Channel = $channel
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Warning "Call failed: $errorMsg"

        if ($_.Exception.Response) {
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $reader.BaseStream.Position = 0
                $responseBody = $reader.ReadToEnd()
                Write-Host "Error details: $responseBody" -ForegroundColor Red
            } catch {}
        }

        if (-not $UseBackup -and $config.BackupModel) {
            Write-Host "Switching to backup model..." -ForegroundColor Yellow
            return Invoke-AIChat -Tier $Tier -Prompt $Prompt -SystemPrompt $SystemPrompt -UseBackup:$true
        }
        return $null
    }
}