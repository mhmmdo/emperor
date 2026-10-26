<?php
declare(strict_types=1);
date_default_timezone_set('Asia/Makassar');
session_name('emperor_pos');
session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off']);
session_start();
if(!isset($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32));
function db():PDO {
 static $pdo=null;
 if($pdo) return $pdo;
 if(!extension_loaded('pdo_sqlite')) throw new RuntimeException('PDO SQLite belum aktif pada PHP yang digunakan web server.');
 $dir=__DIR__.'/storage';
 if(!is_dir($dir) && !mkdir($dir,0770,true) && !is_dir($dir)) throw new RuntimeException('Tidak bisa membuat storage.');
 $pdo=new PDO('sqlite:'.$dir.'/pos.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
 $pdo->exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
 $pdo->exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sales(id INTEGER PRIMARY KEY,created_at TEXT NOT NULL,method TEXT NOT NULL,total INTEGER NOT NULL,received INTEGER,status TEXT NOT NULL DEFAULT 'paid');
 CREATE TABLE IF NOT EXISTS sale_items(id INTEGER PRIMARY KEY,sale_id INTEGER NOT NULL,product_name TEXT NOT NULL,qty INTEGER NOT NULL,price INTEGER NOT NULL,FOREIGN KEY(sale_id) REFERENCES sales(id));
 CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY,created_at TEXT NOT NULL,description TEXT NOT NULL,amount INTEGER NOT NULL,method TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0)");
 if((int)$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn()===0){
 $seed=[
 ['Emperor Coffee','Kopi',15000],['Emperor Oreo','Kopi',15000],['Emperor Regal','Kopi',15000],['Aren','Kopi',15000],['Butterscotch','Kopi',15000],['Salted Caramel','Kopi',15000],['Hazelnut','Kopi',15000],['Tiramisu','Kopi',15000],
 ['Chocolate','Non Kopi',15000],['Matcha','Non Kopi',15000],['Red Velvet','Non Kopi',15000],['Caramel','Non Kopi',15000],['Vanilla','Non Kopi',15000],['Americano','Kopi',10000],['Pop Mie','Snack',10000],['Mineral','Snack',5000],['Twisko','Snack',5000],['Chitato Lite','Snack',5000],['Aoka','Snack',5000],['Kartu Dum','Snack',5000],['Oreo','Topping',3000],['Regal','Topping',3000]];
 $stmt=$pdo->prepare('INSERT INTO products(name,category,price) VALUES(?,?,?)');
 $pdo->beginTransaction();try{foreach($seed as $product)$stmt->execute($product);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}
 }
 return $pdo;
}
function json(array $payload,int $code=200):never{http_response_code($code);header('Content-Type: application/json; charset=utf-8');echo json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);exit;}
function req():array{$raw=file_get_contents('php://input');if(strlen($raw)>100000) throw new InvalidArgumentException('Permintaan terlalu besar');$data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);if(!is_array($data)||!str_starts_with(ltrim($raw),'{')) throw new InvalidArgumentException('JSON tidak valid');return $data;}
function auth():void{if(empty($_SESSION['uid']))json(['error'=>'Silakan login'],401);}
function check():void{if(!hash_equals($_SESSION['csrf'],(string)($_SERVER['HTTP_X_CSRF_TOKEN']??'')))json(['error'=>'Sesi berakhir. Muat ulang halaman.'],419);}
function dateRange():array{$from=(string)($_GET['from']??date('Y-m-d'));$to=(string)($_GET['to']??date('Y-m-d'));foreach([$from,$to] as $d){$x=DateTimeImmutable::createFromFormat('!Y-m-d',$d);if(!$x||$x->format('Y-m-d')!==$d)throw new InvalidArgumentException('Tanggal tidak valid');}if($from>$to||$to>(new DateTimeImmutable($from))->modify('+366 days')->format('Y-m-d'))throw new InvalidArgumentException('Rentang tanggal tidak valid');return [$from,$to];}
function amount(mixed $n):int{if(!is_int($n)||$n<1||$n>1000000000)throw new InvalidArgumentException('Nominal tidak valid');return $n;}
function method(mixed $m):string{if(!in_array($m,['cash','qris'],true))throw new InvalidArgumentException('Metode harus cash atau qris');return $m;}
function api():never{
 try{
 $db=db();$action=$_GET['action']??'status';
 if($_SERVER['REQUEST_METHOD']==='POST')check();
 if($action==='status')json(['setup'=>(int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn()===0,'loggedIn'=>!empty($_SESSION['uid']),'csrf'=>$_SESSION['csrf']]);
 if($action==='setup'||$action==='login'){
 $data=req();$username=trim((string)($data['username']??''));$password=(string)($data['password']??'');
 if($username===''||strlen($username)>50||strlen($password)<8)throw new InvalidArgumentException('Username dan password minimal 8 karakter diperlukan.');
 if($action==='setup'){
 $db->beginTransaction();try{if((int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn()!==0)throw new InvalidArgumentException('Admin sudah dibuat');$s=$db->prepare('INSERT INTO users(username,password) VALUES(?,?)');$s->execute([$username,password_hash($password,PASSWORD_DEFAULT)]);$_SESSION['uid']=(int)$db->lastInsertId();$db->commit();}catch(Throwable $e){$db->rollBack();throw $e;}
 }else{$s=$db->prepare('SELECT * FROM users WHERE username=?');$s->execute([$username]);$u=$s->fetch();if(!$u||!password_verify($password,$u['password']))json(['error'=>'Username atau password salah'],401);$_SESSION['uid']=(int)$u['id'];}
 session_regenerate_id(true);json(['ok'=>true]);
 }
 auth();
 if($action==='logout'){unset($_SESSION['uid']);json(['ok'=>true]);}
 if($action==='products')json(['data'=>$db->query('SELECT * FROM products ORDER BY id')->fetchAll()]);
 if($action==='checkout'){
 $data=req();$items=$data['items']??[];if(!is_array($items)||count($items)<1||count($items)>60)throw new InvalidArgumentException('Keranjang kosong atau terlalu banyak item.');
 $m=method($data['method']??null);$total=0;$rows=[];$lookup=$db->prepare('SELECT * FROM products WHERE id=?');
 foreach($items as $item){if(!is_array($item)||!is_int($item['id']??null)||!is_int($item['qty']??null)||$item['qty']<1||$item['qty']>99)throw new InvalidArgumentException('Isi keranjang tidak valid');$lookup->execute([$item['id']]);$p=$lookup->fetch();if(!$p)throw new InvalidArgumentException('Menu tidak ditemukan');$total+=$p['price']*$item['qty'];$rows[]=[$p['name'],$item['qty'],$p['price']];}
 $received=$m==='cash'?($data['received']??0):null;if($m==='cash'&&(!is_int($received)||$received<$total))throw new InvalidArgumentException('Uang diterima kurang dari total');
 $db->beginTransaction();try{$stmt=$db->prepare("INSERT INTO sales(created_at,method,total,received) VALUES(?,?,?,?)");$stmt->execute([date('Y-m-d H:i:s'),$m,$total,$received]);$id=(int)$db->lastInsertId();$line=$db->prepare('INSERT INTO sale_items(sale_id,product_name,qty,price) VALUES(?,?,?,?)');foreach($rows as $r)$line->execute([$id,...$r]);$db->commit();}catch(Throwable $e){$db->rollBack();throw $e;}
 json(['data'=>['id'=>$id,'total'=>$total,'change'=>$m==='cash'?$received-$total:0]],201);
 }
 if($action==='expense-create'){
 $d=req();$title=trim((string)($d['description']??''));if($title===''||strlen($title)>150)throw new InvalidArgumentException('Keterangan pengeluaran tidak valid');
 $stmt=$db->prepare('INSERT INTO expenses(created_at,description,amount,method) VALUES(?,?,?,?)');$stmt->execute([date('Y-m-d H:i:s'),$title,amount($d['amount']??null),method($d['method']??null)]);json(['ok'=>true],201);
 }
 if($action==='sale-void'){
 $d=req();if(!is_int($d['id']??null))throw new InvalidArgumentException('ID tidak valid');$stmt=$db->prepare("UPDATE sales SET status='void' WHERE id=? AND status='paid'");$stmt->execute([$d['id']]);if(!$stmt->rowCount())throw new InvalidArgumentException('Transaksi tidak tersedia');json(['ok'=>true]);
 }
 if($action==='expense-delete'){
 $d=req();if(!is_int($d['id']??null))throw new InvalidArgumentException('ID tidak valid');$stmt=$db->prepare('UPDATE expenses SET deleted=1 WHERE id=? AND deleted=0');$stmt->execute([$d['id']]);json(['ok'=>true]);
 }
 if($action==='report'){
 [$from,$to]=dateRange();$sales=$db->prepare('SELECT * FROM sales WHERE substr(created_at,1,10) BETWEEN ? AND ? ORDER BY id DESC');$sales->execute([$from,$to]);$sales=$sales->fetchAll();
 $expenses=$db->prepare('SELECT * FROM expenses WHERE substr(created_at,1,10) BETWEEN ? AND ? ORDER BY id DESC');$expenses->execute([$from,$to]);$expenses=$expenses->fetchAll();
 $summary=['cash'=>0,'qris'=>0,'expenses_cash'=>0,'expenses_qris'=>0,'count'=>0];
 foreach($sales as $s)if($s['status']==='paid'){$summary[$s['method']]+=$s['total'];$summary['count']++;}
 foreach($expenses as $e)if(!$e['deleted'])$summary['expenses_'.$e['method']]+=$e['amount'];
 $summary['income']=$summary['cash']+$summary['qris'];$summary['outgoing']=$summary['expenses_cash']+$summary['expenses_qris'];$summary['net']=$summary['income']-$summary['outgoing'];$summary['cash_change']=$summary['cash']-$summary['expenses_cash'];
 json(['data'=>['summary'=>$summary,'sales'=>$sales,'expenses'=>$expenses]]);
 }
 throw new InvalidArgumentException('Endpoint tidak ditemukan');
 }catch(InvalidArgumentException|JsonException $e){json(['error'=>$e->getMessage()],422);}catch(Throwable $e){$id=bin2hex(random_bytes(4));$dir=__DIR__.'/storage/logs';if(!is_dir($dir))@mkdir($dir,0770,true);@file_put_contents($dir.'/error.log',date('c').' '.$id.' '.(string)$e.PHP_EOL,FILE_APPEND|LOCK_EX);error_log('Emperor POS incident '.$id.': '.$e->getMessage());json(['error'=>'Terjadi gangguan pada server. Kode: '.$id],500);}
}
if(isset($_GET['api']))api();
