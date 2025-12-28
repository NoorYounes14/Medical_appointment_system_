<?php
require_once 'config.php';

if(isset($_POST['code'])){
    $code = $_POST['code'];
    $email = $_SESSION['reset_email'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE email=? AND reset_code=?");
    $stmt->bind_param("si",$email,$code);
    $stmt->execute();
    $result = $stmt->get_result();

    if($result->num_rows>0){
        $_SESSION['code_verified']=true;
        header("Location: reset_password.php");
        exit();
    } else {
        $_SESSION['verify_error']='Invalid code';
        header("Location: verify_code.php");
        exit();
    }
}
?>