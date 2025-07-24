select ID, Name from city limit 10 offset 5;
select * from city where CountryCode = 'CHN';
INSERT INTO stores (stor_id,stor_name,stor_address,city,state,zip) 
VALUES ('9000', 'Books Galore', '123 Main St', 'Anytown', 'MY', '12345');
INSERT INTO employee (emp_id,fname,minit,lname,job_id,job_lvl,pub_id,hire_data) 
VALUES ('XYZ123', 'John', 'D', 'Smith', '6', '215' ,'9952' ,'19800101');
/*
module4 2and7
*/
select avg(price) as title_price from titles;
select type, min(price) as min_price from titles where price < 20;
/*
module5 exercise
*/
select a.au_id, title_id from authors a
inner join titleauthor ta on a.au_id = ta.au_id;

select t.title, t.price, p.pub_name
from titles t
inner join publishers p on p.pub_id = t.pub_id;

select p.pub_name, avg(t.price) as avg_price
from titles t
inner join publishers p on p.pub_id = t.pub_id;

select a.au_name, t.title from authors a
inner join titleauthor ta on a.au_id = ta.au_id
inner join titles t on ta.title_id = t.title_id;

select t.title_id from titles t
group by t.title_id having count(distinct t.au_id)>1;

create table stocks_info(
	stocks_id int auto_increment primary key,
    stocks_name varchar(255) not null
);
create table stocks_detail(
	record_id int auto_increment primary key,
    stocks_info_id int not null comment'stocks_id',
    time_stamp timestamp not null,
    open decimal(10,2),
	high decimal(10,2),
	low decimal(10,2),
	close decimal(10,2),
    quantity int,
    foreign key(stocks_info_id)
    references stocks_info(stocks_id)
);

