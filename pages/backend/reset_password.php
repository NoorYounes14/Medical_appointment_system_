<?php
require_once 'config.php';

if(isset($_POST['password']) && isset($_SESSION['code_verified'])){
    $password = password_hash($_POST['password'],PASSWORD_DEFAULT);
    $email = $_SESSION['reset_email'];

    $stmt = $conn->prepare("UPDATE users SET password=?, reset_code=NULL WHERE email=?");
    $stmt->bind_param("ss",$password,$email);
    $stmt->execute();

    unset($_SESSION['code_verified']);
    unset($_SESSION['reset_email']);
    header("Location: index.php");
    exit();
}
?>