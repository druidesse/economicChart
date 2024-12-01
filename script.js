// 전역 변수로 DOM 요소들 저장
let monthAmountInput, fixedAmountInput, savingAmountInput;
let weeklyAmounts = [];
let emergencyAmountInput;
let dailyAmountInput;

// 초기화 함수
function initializeElements() {
    monthAmountInput = document.getElementById('isMonthAmount');
    fixedAmountInput = document.getElementById('isFixedAmount');
    savingAmountInput = document.getElementById('isSavingAmount');
    emergencyAmountInput = document.getElementById('isEmergencyAmount');
    
    // 주간 금액 입력 필드들
    weeklyAmounts = [
        document.getElementById('isFirstWeekAmount'),
        document.getElementById('isSecondWeekAmount'),
        document.getElementById('isThirdWeekAmount'),
        document.getElementById('isFourthWeekAmount'),
        document.getElementById('isFifthWeekAmount')
    ];

    // 하루 사용 금액 입력 필드
    const inputs = document.querySelectorAll('#isSavingAmount');
    dailyAmountInput = inputs[1]; // 두 번째 isSavingAmount 요소
}

// 계산 함수
function calculateAll() {
    const monthInput = document.getElementById('isMonth');
    const month = Number(monthInput.value);
    
    // 해당 월의 총 일수 계산
    const year = new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 각 주차별 일수 계산 (월초가 월요일이라 가정)
    const weeksInMonth = [];
    let remainingDays = daysInMonth;
    
    // 첫 4주는 7일씩
    for (let i = 0; i < 4; i++) {
        if (remainingDays >= 7) {
            weeksInMonth.push(7);
            remainingDays -= 7;
        } else if (remainingDays > 0) {
            weeksInMonth.push(remainingDays);
            remainingDays = 0;
        }
    }
    
    // 남은 일수가 있다면 5째 주에 배정
    if (remainingDays > 0) {
        weeksInMonth.push(remainingDays);
    }

    const monthAmount = Number(monthAmountInput.value) || 0;
    const fixedAmount = Number(fixedAmountInput.value) || 0;
    const savingAmount = Number(savingAmountInput.value) || 0;

    // 실제 사용 가능 금액 계산
    const availableAmount = monthAmount - fixedAmount - savingAmount;
    
    // 비상금 계산 (5%)
    const emergencyAmount = Math.floor(availableAmount * 0.05);
    emergencyAmountInput.value = emergencyAmount;

    // 일일 평균 금액 계산
    const dailyBase = Math.floor((availableAmount - emergencyAmount) / daysInMonth);

    // 간 배당금 계산
    weeklyAmounts.forEach((input, index) => {
        if (index < weeksInMonth.length) {
            input.value = roundDownToTen(dailyBase * weeksInMonth[index]);
        } else {
            input.value = 0;
        }
    });

    // 하루 사용 가능 금액 계산
    const dailyAmount = roundDownToTen(Math.floor(availableAmount / daysInMonth));
    dailyAmountInput.value = dailyAmount;

    console.log('계산 완료', {
        월: month,
        총일수: daysInMonth,
        주차별일수: weeksInMonth,
        월총액: monthAmount,
        실사용가능액: availableAmount,
        일일기준금액: dailyBase,
        하루사용액: dailyAmount
    });
}
// 십원 단위 내림 함수
function roundDownToTen(number) {
    return Math.floor(number / 10) * 10;
}

// 재화 추가 함수
function addNewGoods(e) {
    if (e.key !== 'Enter') return;

    const nameInput = document.getElementById('inputGoodsName');
    const lowestInput = document.getElementById('lowestPrice');
    const highestInput = document.getElementById('highestPrice');

    const name = nameInput.value.trim();
    const lowest = Number(lowestInput.value);
    const highest = Number(highestInput.value);

    // 입력값 검증
    if (!name || !lowest || !highest || lowest > highest) {
        alert('올바른 값을 입력해주세요.');
        return;
    }

    const average = Math.floor((lowest + highest) / 2);
    
    // 리스트 아이템 생성
    const li = document.createElement('li');
    li.innerHTML = `
        <h4>${name} ${lowest} ~ ${highest} 원</h4>
        => 회당 평균 <b>${average}</b> 원
    `;

    // 리스트에 추가 (마지막 위치에 추가하도록 수정)
    const goodsList = document.getElementById('isGoodsList');
    goodsList.appendChild(li);

    // 권장소비량에 새로운 항목 추가 (기본값을 0으로 변경)
    const recommendContainer = document.getElementById('recommendContainer');
    const newRecommend = document.createElement('span');
    newRecommend.className = 'inblock-item';
    const goodsIndex = recommendContainer.children.length + 1;
    newRecommend.innerHTML = `주 <input type="number" value="0" min="0" class="input4em left" id="goods${goodsIndex}canuse">회 ${name} 권장
        <button class="delete-btn">×</button>`;
    recommendContainer.appendChild(newRecommend);

    // 삭제 버튼에 이벤트 리스너 추가
    const deleteBtn = newRecommend.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', deleteRecommendItem);

    // 새로 추가된 입력 필드에 이벤트 리스너 추가
    const newInput = newRecommend.querySelector('input');
    newInput.addEventListener('input', calculateRecommendations);
    newInput.addEventListener('change', calculateRecommendations);

    // 입력 필드 초기화
    nameInput.value = '';
    lowestInput.value = '';
    highestInput.value = '';

    // 권장소비량 계산 실행
    calculateRecommendations();
}

// 권장소비량 계산 함수 수정
function calculateRecommendations() {
    const weeklyBudget = Number(document.getElementById('isSecondWeekAmount').value) || 0;
    const recommendItems = document.querySelectorAll('.inblock-item');
    const goodsItems = document.querySelectorAll('#isGoodsList li');
    
    // 각 항목의 평균 가격과 입력값을 함께 배열로 만듦
    const itemsData = Array.from(recommendItems).map((item, index) => {
        const input = item.querySelector('input[type="number"]');
        // 해당 인덱스의 goodsItem에서 가격 추출 (첫 번째 li는 입력 폼이므로 index + 1)
        const priceElement = goodsItems[index + 1]?.querySelector('b');
        const price = priceElement ? Number(priceElement.textContent) : 0;
        const frequency = Number(input.value) || 0;
        
        return {
            input: input,
            frequency: frequency,
            price: price,
            totalCost: price * frequency,
            desiredFrequency: frequency // 사용자가 원하는 횟수 저장
        };
    }).filter(item => item.price > 0); // 유효한 가격이 있는 항목만 포함

    // 총 비용 계산
    const totalCost = itemsData.reduce((sum, item) => sum + item.totalCost, 0);

    // 예산 초과시 조정
    if (totalCost > weeklyBudget) {
        // 가격이 높은 항목부터 정렬 (totalCost가 아닌 단위 가격 기준)
        const sortedItems = [...itemsData].sort((a, b) => b.price - a.price);
        let remainingBudget = weeklyBudget;

        // 모든 항목 초기화
        sortedItems.forEach(item => {
            item.frequency = 0;
            item.input.value = 0;
        });

        // 예산 내에서 점진적으로 재할당
        let allocated = true;
        while (allocated) {
            allocated = false;
            for (let item of sortedItems) {
                // 원하는 횟수보다 적고, 예산이 충분하다면 1회 증가
                if (item.frequency < item.desiredFrequency && remainingBudget >= item.price) {
                    item.frequency++;
                    remainingBudget -= item.price;
                    item.input.value = item.frequency;
                    allocated = true;
                }
            }
        }
    }
}

// 삭제 기능 함수 추가
function deleteRecommendItem(e) {
    const recommendItem = e.target.closest('.inblock-item');
    const goodsList = document.getElementById('isGoodsList');
    const index = Array.from(document.querySelectorAll('.inblock-item')).indexOf(recommendItem);
    
    // 해당 인덱스의 goodsList 항목도 삭제 (첫 번째 항목은 입력 폼이므로 index + 1)
    const goodsItems = goodsList.querySelectorAll('li');
    if (goodsItems[index + 1]) {
        goodsItems[index + 1].remove();
    }
    
    // 권장소비량 항목 삭제
    recommendItem.remove();
    
    // 권장소비량 다시 계산
    calculateRecommendations();
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드됨'); // 디버깅용
    
    // DOM 요소 초기
    initializeElements();

    // 금액 관련 입력 필드들에 이벤트 리스너 추가
    monthAmountInput.addEventListener('input', calculateAll);
    fixedAmountInput.addEventListener('input', calculateAll);
    savingAmountInput.addEventListener('input', calculateAll);

    // 재화 입력 필드들에 이벤트 리스너 추가
    const inputs = ['inputGoodsName', 'lowestPrice', 'highestPrice'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('keypress', addNewGoods);
    });

    // 기존 권장소비량 입력 필드들에 이벤트 리스너 추가
    const recommendContainer = document.getElementById('recommendContainer');
    recommendContainer.addEventListener('input', function(e) {
        if (e.target.type === 'number') {
            calculateRecommendations();
        }
    });

    recommendContainer.addEventListener('change', function(e) {
        if (e.target.type === 'number') {
            calculateRecommendations();
        }
    });

    // 두번째 주 금액 입력 필드에 이벤트 리스너 추가
    const secondWeekInput = document.getElementById('isSecondWeekAmount');
    if (secondWeekInput) {
        secondWeekInput.addEventListener('input', calculateRecommendations);
        secondWeekInput.addEventListener('change', calculateRecommendations);
    }

    // 기존 삭제 버튼들에 이벤트 리스너 추가
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteRecommendItem);
    });

    // 초기 계산 실행
    calculateAll();
});