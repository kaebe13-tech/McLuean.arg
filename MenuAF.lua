--[[ 
SAILOR PIECE AUTOFARM MENU v2 
Credits: @kaebe13-tech & Copilot
Instructions: 
- Press "RightShift" TOGGLE MENU VISIBILITY
- Use buttons to toggle autofarm options
- Put on GitHub as e.g. /main/MenuAF.lua and use a loadstring to run!
]]

local Players = game:GetService("Players")
local UIS = game:GetService("UserInputService")
local CoreGui = game:GetService("CoreGui")
local LocalPlayer = Players.LocalPlayer

local config = {
    autoFarm = false,
    targetType = "mob", -- or "boss"
    teleportToTarget = true,
    searchRadius = 1000,
    attackDistance = 8,
    attackCooldown = 1.2,
}
local guiName = "AutofarmMenu_KAEBE"

-- CLEANUP OLD GUI
if CoreGui:FindFirstChild(guiName) then
    CoreGui[guiName]:Destroy()
end

-- CREATE UI
local gui = Instance.new("ScreenGui")
gui.Name = guiName
gui.ResetOnSpawn = false
gui.Parent = CoreGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 220, 0, 245)
frame.Position = UDim2.new(0, 40, 0, 110)
frame.BackgroundColor3 = Color3.fromRGB(33,33,44)
frame.BorderColor3 = Color3.fromRGB(200,168,67)
frame.BorderSizePixel = 2
frame.Parent = gui

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 38)
title.BackgroundTransparency = 1
title.Text = "SAILOR PIECE AUTOFARM"
title.TextColor3 = Color3.fromRGB(255, 205, 83)
title.Font = Enum.Font.GothamBold
title.TextSize = 18
title.Parent = frame

local info = Instance.new("TextLabel")
info.Size = UDim2.new(1, -24, 0, 22)
info.Position = UDim2.new(0, 10, 0, 203)
info.BackgroundTransparency = 1
info.Text = "▶ RightShift = Hide/Show Menu"
info.TextColor3 = Color3.fromRGB(180,180,180)
info.Font = Enum.Font.Gotham
info.TextSize = 13
info.TextXAlignment = Enum.TextXAlignment.Left
info.Parent = frame

local y = 54
local spacing = 36

local autofarmBtn = Instance.new("TextButton")
autofarmBtn.Size = UDim2.new(1, -32, 0, 32)
autofarmBtn.Position = UDim2.new(0, 16, 0, y)
autofarmBtn.BackgroundColor3 = Color3.fromRGB(42,51,68)
autofarmBtn.BorderColor3 = Color3.fromRGB(90,90,90)
autofarmBtn.Font = Enum.Font.GothamBold
autofarmBtn.TextSize = 15
autofarmBtn.TextColor3 = Color3.fromRGB(255,255,255)
autofarmBtn.Text = "Autofarm: OFF"
autofarmBtn.Parent = frame

local mobBtn = Instance.new("TextButton")
mobBtn.Size = UDim2.new(1, -32, 0, 32)
mobBtn.Position = UDim2.new(0, 16, 0, y+spacing)
mobBtn.BackgroundColor3 = Color3.fromRGB(55,67,78)
mobBtn.BorderColor3 = Color3.fromRGB(120,120,120)
mobBtn.Font = Enum.Font.Gotham
mobBtn.TextSize = 15
mobBtn.TextColor3 = Color3.new(1,1,1)
mobBtn.Text = "-> Target: MOB"
mobBtn.Parent = frame

local bossBtn = Instance.new("TextButton")
bossBtn.Size = UDim2.new(1, -32, 0, 32)
bossBtn.Position = UDim2.new(0, 16, 0, y+spacing*2)
bossBtn.BackgroundColor3 = Color3.fromRGB(67,55,78)
bossBtn.BorderColor3 = Color3.fromRGB(120,120,120)
bossBtn.Font = Enum.Font.Gotham
bossBtn.TextSize = 15
bossBtn.TextColor3 = Color3.new(1,1,1)
bossBtn.Text = "Target: BOSS"
bossBtn.Parent = frame

local tpBtn = Instance.new("TextButton")
tpBtn.Size = UDim2.new(1, -32, 0, 32)
tpBtn.Position = UDim2.new(0,16, 0, y+spacing*3)
tpBtn.BackgroundColor3 = Color3.fromRGB(68,68,58)
tpBtn.BorderColor3 = Color3.fromRGB(120,120,120)
tpBtn.Font = Enum.Font.Gotham
tpBtn.TextSize = 15
tpBtn.TextColor3 = Color3.new(1,1,1)
tpBtn.Text = "Teleport: ON"
tpBtn.Parent = frame

-- DRAGGABLE UI
local dragging, dragInput, dragStart, startPos
frame.Active = true
frame.Draggable = true

-- BUTTON LOGIC
autofarmBtn.MouseButton1Click:Connect(function()
    config.autoFarm = not config.autoFarm
    autofarmBtn.Text = "Autofarm: "..(config.autoFarm and "ON" or "OFF")
    autofarmBtn.BackgroundColor3 = config.autoFarm and Color3.fromRGB(67,132,54) or Color3.fromRGB(42,51,68)
end)
mobBtn.MouseButton1Click:Connect(function()
    config.targetType = "mob"
    mobBtn.Text = "-> Target: MOB"
    bossBtn.Text = "Target: BOSS"
end)
bossBtn.MouseButton1Click:Connect(function()
    config.targetType = "boss"
    mobBtn.Text = "Target: MOB"
    bossBtn.Text = "-> Target: BOSS"
end)
tpBtn.MouseButton1Click:Connect(function()
    config.teleportToTarget = not config.teleportToTarget
    tpBtn.Text = "Teleport: "..(config.teleportToTarget and "ON" or "OFF")
    tpBtn.BackgroundColor3 = config.teleportToTarget and Color3.fromRGB(67,132,54) or Color3.fromRGB(68,68,58)
end)

-- UI SHOW/HIDE
UIS.InputBegan:Connect(function(inp,gp)
    if inp.KeyCode == Enum.KeyCode.RightShift and not gp then
        frame.Visible = not frame.Visible
    end
end)
frame.Visible = true

-- ENEMY SEARCH & ATTACK
local function getNearestTarget()
    local c
    pcall(function() c = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait() end)
    if not c or not c:FindFirstChild("HumanoidRootPart") then return nil end
    local hrp = c.HumanoidRootPart
    local nearest, nearestDist = nil, math.huge
    for _, npc in ipairs(workspace:GetChildren()) do
        if npc:IsA("Model") and npc:FindFirstChild("Humanoid") and npc:FindFirstChild("HumanoidRootPart") then
            local name = npc.Name:lower()
            -- CHANGE NAME CHECKS HERE for your game's enemies:
            local isTarget = false
            if config.targetType=="mob" and (name:find("bandit") or name:find("mob")) then
                isTarget = true
            elseif config.targetType=="boss" and (name:find("boss") or name:find("admiral")) then
                isTarget = true
            end
            if isTarget and npc.Humanoid.Health > 0 then
                local dist = (hrp.Position - npc.HumanoidRootPart.Position).Magnitude
                if dist < config.searchRadius and dist < nearestDist then
                    nearestDist = dist
                    nearest = npc
                end
            end
        end
    end
    return nearest
end

local function attackTarget(target)
    local c = LocalPlayer.Character
    if not c or not target or not target:FindFirstChild("HumanoidRootPart") then return end
    local hrp = c:FindFirstChild("HumanoidRootPart")
    if config.teleportToTarget and hrp then
        hrp.CFrame = target.HumanoidRootPart.CFrame * CFrame.new(0,0,-config.attackDistance)
    end
    local tool = c:FindFirstChildOfClass("Tool")
    if tool then tool:Activate() end
    -- If the game requires a RemoteEvent for attack, add it here!
end

-- AUTOFARM LOOP
spawn(function()
    while true do
        if config.autoFarm then
            pcall(function()
                local tar = getNearestTarget()
                if tar then attackTarget(tar) end
            end)
        end
        wait(config.attackCooldown)
    end
end)

print("[OK] Autofarm menu loaded! Use RightShift to show/hide the GUI!")
