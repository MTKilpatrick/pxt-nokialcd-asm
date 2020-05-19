sendBufferAsm:
 	; arguments are: r0 - buffer, r1 - data pin, r2 - clock pin
    push {r4,r5,r6,r7,lr}
    mov r3, r8
    mov r4, r9
    mov r5, r10
    mov r6, r11
    mov r7, r12
    push {r3, r4,r5,r6,r7}

    mov r4, r0 ; save buff
    mov r7, r1 ; save data pin
    mov r8, r2 ; save clock pin
    mov r0, r4
    bl BufferMethods::length
    mov r5, r0          ; r5 contains buffer length
    
    mov r0, r4
    bl BufferMethods::getBytes
    mov r4, r0          ; r4 points to the data
    
    ; setup 1st pin as digital
    mov r0, r7
    movs r1, #0
    bl pins::digitalWritePin
	
    ; setup 2nd pin as digital
    mov r0, r8
    movs r1, #0
    bl pins::digitalWritePin

    ; load clock pin address into r0 and get addrs/mask
    mov r0, r8
    bl pins::getPinAddress
    ldr r0, [r0, #8] ; get mbed DigitalOut from MicroBitPin
    ldr r1, [r0, #4] ; r1-mask for this pin
    ldr r2, [r0, #16] ; r2-clraddr
    ldr r3, [r0, #12] ; r3-setaddr
    str r1, [r2, #0] ; set clock pin low  (unnecessary)
    mov r10, r1   ; r10 is the mask for the clock pin
    mov r11, r2   ; r11 is for set low clock pin
    mov r12, r3   ;  r12 is for set high clock pin

    ; load pin address
    mov r0, r7
    bl pins::getPinAddress
    ldr r0, [r0, #8] ; get mbed DigitalOut from MicroBitPin
    ldr r1, [r0, #4] ; r1-mask for this pin
    ldr r2, [r0, #16] ; r2-clraddr
    ldr r3, [r0, #12] ; r3-setaddr
    str r1, [r2, #0] ; set data pin low
    mov r7, r1   ; r7 is the mask data pin
    mov r8, r2   ;  r8 is for set low data pin
    mov r9, r3  ;  r9 is for set high data pin

    mov r2, r7  ; set r2 to be mask for data pin
    mov r1, r10 ; set r1 to be mask for clock pin


.start:
    movs r6, #0x80      ; reset mask 
    ldrb r0, [r4, #0]  ; r0 := *r4               ; C2
.common:
    tst r6, r0                           
    mov r3, r11     ; prepare r3 for clock low      ; C1 
    str r1, [r3]    ; clock pin := lo
    nop
    nop
    nop
    nop
	mov r3, r9      ; get the setaddr for datapin   ; C1
    bne .nextone                                    ; C1 + p
	mov r3, r8      ; get the clraddr for data pin  ; C1
.nextone:
    str r2, [r3]    ; set data pin                  ; C2
    nop
    nop
    nop
    nop
    mov r3, r12     ; get the setaddr for clock     ; C1   
    lsrs r6, r6, #1     ; r6 >>= 1   C7             ; C1
    str r1, [r3]    ; clock pin := high             ; C2
    nop
    nop
    nop
    nop
    bne .common       ;            C8             ; C1 + p
    ; not just a bit - need new byte
    adds r4, #1         ; r4++       C9
    subs r5, #1         ; r5--       C10
    bcs .start           ; if (r5>=0) goto .start  C11

.stop:
    nop
    nop
    mov r3, r11     ; prepare r3 for clock low      ; C1 
    str r1, [r3]    ; clock pin := lo

    pop {r3,r4,r5,r6,r7}
    mov r8, r3
    mov r9, r4
    mov r10, r5
    mov r11, r6
    mov r12, r7
    pop {r4,r5,r6,r7,pc}


