<?php
require_once 'config.php';
require_once 'phpMailer/phpMailer-master/src/PHPMailer.php';
require_once 'phpMailer/phpMailer-master/src/SMTP.php';
require_once 'phpMailer/phpMailer-master/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if(isset($_POST['email'])){
    $email = $_POST['email'];
    $code = rand(100000,999999); 
    $stmt = $conn->prepare("UPDATE users SET reset_code=? WHERE email=?");
    $stmt->bind_param("is",$code,$email);
    $stmt->execute();
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host='smtp.example.com';
    $mail->SMTPAuth=true;
    $mail->Username='your_email@example.com';
    $mail->Password='your_email_password';
    $mail->SMTPSecure='tls';
    $mail->Port=587;
    $mail->setFrom('your_email@example.com','Medical App');
    $mail->addAddress($email);
    $mail->isHTML(true);
    $mail->Subject='Password Reset Code';
    $mail->Body="Your password reset code is: $code";
    $mail->send();
    $_SESSION['reset_email']=$email;
    header("Location: verify_code.php");
    exit();
}
?>