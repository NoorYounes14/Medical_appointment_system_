<?php
session_start();
require_once 'config.php';

$error = '';
$step = $_SESSION['reset_step'] ?? 1;

if(isset($_POST['send_code'])){
    $email = $_POST['email'];
    $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
    $stmt->bind_param("s",$email);
    $stmt->execute();
    $result = $stmt->get_result();

    if($result->num_rows > 0){
        $_SESSION['reset_email'] = $email;
        $_SESSION['reset_step'] = 2;
        require_once 'send_reset_code.php';
    } else {
        $error = "Email not found";
    }
}

if(isset($_POST['verify_code'])){
    $code = $_POST['code'];
    $email = $_SESSION['reset_email'];

    $stmt = $conn->prepare("SELECT reset_code FROM users WHERE email=?");
    $stmt->bind_param("s",$email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if($user['reset_code'] == $code){
        $_SESSION['reset_step'] = 3;
    } else {
        $error = "Incorrect code. Please try again.";
    }
}

if(isset($_POST['change_password'])){
    $new = $_POST['new_password'];
    $confirm = $_POST['confirm_password'];
    $email = $_SESSION['reset_email'];

    if($new === $confirm){
        $hashed = password_hash($new, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password=?, reset_code=NULL WHERE email=?");
        $stmt->bind_param("ss",$hashed,$email);
        $stmt->execute();
        session_unset();
        session_destroy();
        header("Location: index.php");
        exit();
    } else {
        $error = "Passwords do not match";
    }
}
?>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
    <div class="form-box active">
        <?php if($step==1): ?>
        <form method="post">
            <h2>Enter your email</h2>
            <?php if($error) echo "<p class='error-message'>$error</p>"; ?>
            <input type="email" name="email" placeholder="Email" required>
            <button type="submit" name="send_code">Send Code</button>
        </form>
        <?php elseif($step==2): ?>
        <form method="post">
            <h2>Enter 6-digit code</h2>
            <?php if($error) echo "<p class='error-message'>$error</p>"; ?>
            <input type="text" name="code" placeholder="6-digit code" required>
            <button type="submit" name="verify_code">Verify Code</button>
        </form>
        <?php elseif($step==3): ?>
        <form method="post">
            <h2>Enter new password</h2>
            <?php if($error) echo "<p class='error-message'>$error</p>"; ?>
            <input type="password" name="new_password" placeholder="New password" required>
            <input type="password" name="confirm_password" placeholder="Confirm password" required>
            <button type="submit" name="change_password">Save Changes</button>
        </form>
        <?php endif; ?>
    </div>
</div>
</body>
</html>